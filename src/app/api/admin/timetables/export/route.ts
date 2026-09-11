import PDFDocument from "pdfkit";
import { TimetableStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { adminGuard, failure } from "@/lib/admin-api";
import { prisma } from "@/lib/prisma";

function dayLabel(day: string) {
  return day.slice(0, 1) + day.slice(1).toLowerCase();
}

function addPageNumber(document: PDFKit.PDFDocument, pageIndex: number) {
  const pageRange = document.bufferedPageRange();
  const footerY = document.page.height - document.page.margins.bottom + 8;
  document.fontSize(8).fillColor("#64748b").text(`Page ${pageIndex + 1} of ${pageRange.count}`, 0, footerY, { align: "center", width: document.page.width });
}

function fittedText(document: PDFKit.PDFDocument, text: string, x: number, y: number, width: number, maxSize: number, minSize = 5.25) {
  let size = maxSize;
  document.fontSize(size);
  while (size > minSize && document.widthOfString(text) > width) {
    size -= 0.25;
    document.fontSize(size);
  }
  document.text(text, x, y, { width, lineBreak: false });
}

export async function GET() {
  const denied = await adminGuard();
  if (denied) return denied;

  try {
    const timetable = await prisma.timetable.findFirst({
      where: { status: TimetableStatus.PUBLISHED },
      orderBy: [{ publishedAt: "desc" }, { updatedAt: "desc" }],
      include: {
        entries: {
          include: {
            section: { include: { class: true } },
            subject: true,
            teacher: { include: { user: true } },
            room: true,
            period: true,
          },
          orderBy: [{ section: { class: { name: "asc" } } }, { section: { name: "asc" } }, { day: "asc" }, { period: { periodNumber: "asc" } }],
        },
      },
    });

    if (!timetable) return NextResponse.json({ error: "No published timetable is available to export" }, { status: 404 });

    const enabledWorkingDays = await prisma.workingDay.findMany({ where: { enabled: true }, orderBy: { day: "asc" }, select: { day: true } });
    const days = enabledWorkingDays.length ? enabledWorkingDays.map((item) => item.day) : [...new Set(timetable.entries.map((entry) => entry.day))];

    const sections = new Map<string, { className: string; sectionName: string; entries: typeof timetable.entries }>();
    timetable.entries.forEach((entry) => {
      const key = entry.sectionId;
      const current = sections.get(key) ?? { className: entry.section.class.name, sectionName: entry.section.name, entries: [] };
      current.entries.push(entry);
      sections.set(key, current);
    });

    const document = new PDFDocument({ layout: "landscape", size: "A4", margins: { top: 36, bottom: 42, left: 36, right: 36 }, bufferPages: true });
    const chunks: Buffer[] = [];
    document.on("data", (chunk) => chunks.push(chunk));

    document.font("Helvetica-Bold").fontSize(20).fillColor("#0f172a").text("Acalude", 36, 36);
    document.font("Helvetica").fontSize(13).fillColor("#334155").text(`Published Timetable · Version ${timetable.version}`, 36, 62);
    document.fontSize(9).fillColor("#64748b").text(`Published: ${timetable.publishedAt?.toLocaleString() ?? ""}`, 36, 84);

    const pageWidth = 720;
    const labelWidth = 72;
    const dayWidth = (pageWidth - labelWidth) / days.length;
    const headerY = 142;
    const headerHeight = 24;
    const footerReserve = 20;

    for (const [sectionIndex, section] of [...sections.values()].entries()) {
      if (sectionIndex > 0) document.addPage();
      document.font("Helvetica-Bold").fontSize(15).fillColor("#0f172a").text(`${section.className} · Section ${section.sectionName}`, 36, 106);
      document.font("Helvetica").fontSize(9).fillColor("#64748b").text("Official published schedule", 36, 126);

      document.font("Helvetica-Bold").fontSize(8);
      const periodIds = [...new Map(section.entries.map((entry) => [entry.periodId, entry.period])).values()].sort((a, b) => a.periodNumber - b.periodNumber);
      const availableTableHeight = document.page.height - document.page.margins.bottom - headerY - headerHeight - footerReserve;
      const rowHeight = Math.min(62, Math.max(32, availableTableHeight / Math.max(periodIds.length, 1)));

      document.rect(36, headerY, labelWidth, headerHeight).fill("#166534");
      document.fillColor("#ffffff");
      fittedText(document, "Period", 42, headerY + 8, labelWidth - 12, 8);
      days.forEach((day, index) => {
        const x = 36 + labelWidth + index * dayWidth;
        document.rect(x, headerY, dayWidth, headerHeight).fill("#166534");
        document.fillColor("#ffffff");
        fittedText(document, dayLabel(day), x + 5, headerY + 8, dayWidth - 10, 8);
      });

      periodIds.forEach((period, periodIndex) => {
        const y = headerY + headerHeight + periodIndex * rowHeight;
        document.rect(36, y, pageWidth, rowHeight).fill(periodIndex % 2 === 0 ? "#f8fafc" : "#ffffff");
        document.rect(36, y, labelWidth, rowHeight).fill("#f1f5f9");
        document.font("Helvetica-Bold").fillColor("#334155");
        fittedText(document, `P${period.periodNumber}`, 42, y + rowHeight * 0.28, labelWidth - 12, Math.min(8, rowHeight * 0.16));
        document.font("Helvetica").fillColor("#64748b");
        fittedText(document, `${period.startTime}–${period.endTime}`, 42, y + rowHeight * 0.55, labelWidth - 12, Math.min(7, rowHeight * 0.14));

        days.forEach((day, dayIndex) => {
          const x = 36 + labelWidth + dayIndex * dayWidth;
          const entry = section.entries.find((candidate) => candidate.day === day && candidate.periodId === period.id);
          document.rect(x, y, dayWidth, rowHeight).stroke("#e2e8f0");
          if (!entry) return;
          const cellX = x + 6;
          const cellWidth = dayWidth - 12;
          document.font("Helvetica-Bold").fillColor("#0f172a");
          fittedText(document, entry.subject.name, cellX, y + rowHeight * 0.14, cellWidth, Math.min(8, rowHeight * 0.15));
          document.font("Helvetica").fillColor("#475569");
          fittedText(document, entry.teacher.user.name ?? entry.teacher.employeeCode, cellX, y + rowHeight * 0.42, cellWidth, Math.min(7, rowHeight * 0.13));
          document.fillColor("#64748b");
          fittedText(document, entry.room.name, cellX, y + rowHeight * 0.68, cellWidth, Math.min(7, rowHeight * 0.13));
        });
      });
    }

    for (const pageIndex of Array.from({ length: document.bufferedPageRange().count }, (_, index) => index)) {
      document.switchToPage(pageIndex);
      addPageNumber(document, pageIndex);
    }
    document.end();
    const pdf = await new Promise<Buffer>((resolve) => document.on("end", () => resolve(Buffer.concat(chunks))));

    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="acalude-published-timetable-v${timetable.version}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return failure(error);
  }
}
