import ArchiveClient from "./ArchiveClient";

export const revalidate = 0;

// --- MOCK DATA GENERATOR ---
const generateMockInvoices = () => {
  const invoices = [];
  const start = new Date(2024, 0, 1);
  const end = new Date(2026, 7, 12);

  const customers = [
    { name: "Amazon AWS", share: 0.35 },
    { name: "Shell Fleet", share: 0.25 },
    { name: "Adobe Systems", share: 0.15 },
    { name: "Salesforce", share: 0.10 },
    { name: "Telekom", share: 0.10 },
    { name: "Microsoft", share: 0.05 }
  ];

  const regions = [
    { name: "München Zentrum (80333)", zip: "80333", prob: 0.4, lat: 48.1466, lng: 11.5670 },
    { name: "Augsburg (86150)", zip: "86150", prob: 0.2, lat: 48.3715, lng: 10.8985 },
    { name: "Ingolstadt (85049)", zip: "85049", prob: 0.15, lat: 48.7665, lng: 11.4258 },
    { name: "Rosenheim (83022)", zip: "83022", prob: 0.15, lat: 47.8561, lng: 12.1190 },
    { name: "Garmisch (82467)", zip: "82467", prob: 0.1, lat: 47.4921, lng: 11.0955 },
  ];

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const month = d.getMonth();
    const isBadMonth = month === 0 || month === 1 || month === 7;
    const dailyInvoices = isBadMonth ? Math.floor(Math.random() * 2) + 1 : Math.floor(Math.random() * 5) + 3;

    for (let i = 0; i < dailyInvoices; i++) {
      const randCustomer = Math.random();
      let cumulative = 0;
      let selectedCustomer = customers[0].name;
      for (const c of customers) {
        cumulative += c.share;
        if (randCustomer <= cumulative) {
          selectedCustomer = c.name;
          break;
        }
      }

      const randRegion = Math.random();
      let cumReg = 0;
      let selectedRegion = regions[0];
      for (const r of regions) {
        cumReg += r.prob;
        if (randRegion <= cumReg) {
          selectedRegion = r;
          break;
        }
      }

      const yearMultiplier = d.getFullYear() === 2024 ? 0.7 : d.getFullYear() === 2025 ? 0.85 : 1.0;
      const amount = (Math.floor(Math.random() * 750) + 150) * yearMultiplier;

      const currentDate = new Date(2026, 7, 12);
      const isPastMonth = d.getFullYear() < currentDate.getFullYear() || (d.getFullYear() === currentDate.getFullYear() && d.getMonth() < currentDate.getMonth());
      const status = isPastMonth ? 'transmitted' : 'archived';

      invoices.push({
        id: `INV-${d.getTime()}-${i}`,
        created_at: new Date(d).toISOString(),
        vendor_name: selectedCustomer,
        gross_amount: amount,
        status: status,
        zip_code: selectedRegion.zip,
        region_name: selectedRegion.name,
        lat: selectedRegion.lat,
        lng: selectedRegion.lng,
        pdfDownloadUrl: "#mock-pdf",
        xmlDownloadUrl: "#mock-xml"
      });
    }
  }
  return invoices;
};

export default async function ArchivePage() {
  const mockInvoices = generateMockInvoices();

  return (
    <div className="max-w-[1400px] mx-auto">
      <ArchiveClient initialInvoices={mockInvoices} />
    </div>
  );
}
