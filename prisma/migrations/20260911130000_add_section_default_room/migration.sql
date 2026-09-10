ALTER TABLE "Section"
ADD COLUMN "defaultRoomId" TEXT;

CREATE INDEX "Section_defaultRoomId_idx" ON "Section"("defaultRoomId");

ALTER TABLE "Section"
ADD CONSTRAINT "Section_defaultRoomId_fkey"
FOREIGN KEY ("defaultRoomId") REFERENCES "Room"("id") ON DELETE SET NULL ON UPDATE CASCADE;