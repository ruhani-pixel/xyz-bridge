import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

export async function GET() {
  try {
    const data = [
      { Email: "recipient1@gmail.com", Name: "Suresh Kumar", Subject: "Special offer for you", Body: "Hello {{Name}}! Here is your custom offer." },
      { Email: "recipient2@yahoo.com", Name: "Ramesh Singh", Subject: "Another offer", Body: "Hi {{Name}}, check this out!" },
    ];

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "CampaignData");

    // Generate buffer
    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    return new NextResponse(buf, {
      status: 200,
      headers: {
        'Content-Disposition': 'attachment; filename="SolidModels_Campaign_Template.xlsx"',
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to generate template' }, { status: 500 });
  }
}
