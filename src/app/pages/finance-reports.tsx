import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { FileText, Download, Calendar, Filter } from "lucide-react";
import { toast } from "sonner";

const REPORT_TYPES = [
  {
    id: "revenue",
    title: "Revenue Report",
    description: "Detailed revenue breakdown and analysis",
    icon: FileText,
  },
  {
    id: "expense",
    title: "Expense Report",
    description: "Comprehensive expense tracking and categorization",
    icon: FileText,
  },
  {
    id: "profit",
    title: "Profit & Loss Report",
    description: "P&L statement with profit margins",
    icon: FileText,
  },
  {
    id: "vendor",
    title: "Vendor Report",
    description: "Outsourcing and vendor expense analysis",
    icon: FileText,
  },
  {
    id: "customer",
    title: "Customer Report",
    description: "Customer revenue and profitability analysis",
    icon: FileText,
  },
  {
    id: "invoice",
    title: "Invoice Report",
    description: "Invoice summary and payment status",
    icon: FileText,
  },
  {
    id: "cashflow",
    title: "Cash Flow Report",
    description: "Cash flow statement and projections",
    icon: FileText,
  },
  {
    id: "tax",
    title: "Tax Report",
    description: "Tax summary and GST calculations",
    icon: FileText,
  },
];

export function FinanceReports() {
  const [selectedReport, setSelectedReport] = useState("");
  const [dateRange, setDateRange] = useState("this-month");
  const [format, setFormat] = useState("pdf");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const handleGenerateReport = () => {
    if (!selectedReport) {
      toast.error("Please select a report type");
      return;
    }

    // TODO: Implement actual report generation with backend
    toast.success(`Generating ${selectedReport} report...`);
    console.log("Generate report:", {
      type: selectedReport,
      dateRange,
      format,
      startDate,
      endDate,
    });
  };

  const handleQuickExport = (reportId: string) => {
    toast.success(`Exporting ${reportId} report...`);
    console.log("Quick export:", reportId);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="mb-1">Reports</h1>
        <p className="text-muted-foreground">
          Generate and export financial reports
        </p>
      </div>

      {/* Report Generator */}
      <Card>
        <CardHeader>
          <CardTitle>Generate Custom Report</CardTitle>
          <CardDescription>
            Select report type and date range to generate
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="reportType">Report Type</Label>
              <Select value={selectedReport} onValueChange={setSelectedReport}>
                <SelectTrigger>
                  <SelectValue placeholder="Select report type" />
                </SelectTrigger>
                <SelectContent>
                  {REPORT_TYPES.map((report) => (
                    <SelectItem key={report.id} value={report.id}>
                      {report.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateRange">Date Range</Label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="this-week">This Week</SelectItem>
                  <SelectItem value="this-month">This Month</SelectItem>
                  <SelectItem value="last-month">Last Month</SelectItem>
                  <SelectItem value="this-quarter">This Quarter</SelectItem>
                  <SelectItem value="this-year">This Year</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {dateRange === "custom" && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="format">Export Format</Label>
            <Select value={format} onValueChange={setFormat}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pdf">PDF</SelectItem>
                <SelectItem value="excel">Excel (XLSX)</SelectItem>
                <SelectItem value="csv">CSV</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-3">
            <Button onClick={handleGenerateReport}>
              <Download className="size-4 mr-2" />
              Generate Report
            </Button>
            <Button variant="outline">
              <Calendar className="size-4 mr-2" />
              Schedule Report
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Reports */}
      <div>
        <h2 className="mb-4">Quick Reports</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {REPORT_TYPES.map((report) => (
            <Card key={report.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 rounded-lg bg-primary/10">
                    <report.icon className="size-6 text-primary" />
                  </div>
                </div>
                <h3 className="font-semibold mb-1">{report.title}</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {report.description}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => handleQuickExport(report.id)}
                >
                  <Download className="size-3 mr-2" />
                  Export
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Recent Reports */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Reports</CardTitle>
          <CardDescription>Previously generated reports</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="size-12 mx-auto mb-4 opacity-20" />
            <p>No reports generated yet</p>
            <p className="text-sm">
              Generate your first report using the form above
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
