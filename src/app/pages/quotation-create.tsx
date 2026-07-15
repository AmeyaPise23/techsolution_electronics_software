import { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft, Plus, Trash2, GripVertical, UserPlus } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Checkbox } from "../components/ui/checkbox";
import { quotationService, Quotation } from "../services/quotationService";
import { clientService, Client } from "../services/clientService";
import { CreateClientDialog } from "../components/create-client-dialog";
import { toast } from "sonner";

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(amount || 0);

function today() {
  return new Date().toISOString().split("T")[0];
}

function addDays(dateStr: string, days: number) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

interface ItemRow {
  productName: string;
  description: string;
  hsnSac: string;
  warehouse: string;
  batchNumber: string;
  serialNumber: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  discountPercent: number;
  taxPercent: number;
  cgst: number;
  sgst: number;
  igst: number;
  cess: number;
  remarks: string;
}

function emptyItem(): ItemRow {
  return {
    productName: "",
    description: "",
    hsnSac: "",
    warehouse: "",
    batchNumber: "",
    serialNumber: "",
    quantity: 1,
    unit: "Nos",
    unitPrice: 0,
    discountPercent: 0,
    taxPercent: 18,
    cgst: 0,
    sgst: 0,
    igst: 0,
    cess: 0,
    remarks: "",
  };
}

function clamp(value: number, min: number, max: number): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, n));
}

export function QuotationCreate() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Client selection
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [clientDialogOpen, setClientDialogOpen] = useState(false);

  // Customer data (populated from selected client)
  const [customer, setCustomer] = useState({
    id: undefined as number | undefined,
    name: "",
    company: "",
    email: "",
    phone: "",
    address: "",
    gstNumber: "",
  });

  // Shipping
  const [shipToName, setShipToName] = useState("");
  const [shipToCompany, setShipToCompany] = useState("");
  const [shipToAddress, setShipToAddress] = useState("");
  const [placeOfSupply, setPlaceOfSupply] = useState("");

  // Quotation info
  const [quotationDate, setQuotationDate] = useState(today());
  const [validTill, setValidTill] = useState(addDays(today(), 30));
  const [salesPerson, setSalesPerson] = useState("");
  const [branch, setBranch] = useState("");
  const [currency, setCurrency] = useState("INR");
  const [exchangeRate, setExchangeRate] = useState(1);
  const [referenceNumber, setReferenceNumber] = useState("");
  const [customerPoNumber, setCustomerPoNumber] = useState("");
  const [customerPoDate, setCustomerPoDate] = useState("");
  const [rfqNumber, setRfqNumber] = useState("");
  const [enquiryNumber, setEnquiryNumber] = useState("");
  const [projectName, setProjectName] = useState("");
  const [deliveryLocation, setDeliveryLocation] = useState("");
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState("");
  const [leadTime, setLeadTime] = useState("");
  const [deliveryDays, setDeliveryDays] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("");
  const [deliveryTerms, setDeliveryTerms] = useState("");
  const [warranty, setWarranty] = useState("");
  const [freightCharges, setFreightCharges] = useState(0);
  const [installationCharges, setInstallationCharges] = useState(0);

  // Notes & Terms
  const [internalRemarks, setInternalRemarks] = useState("");
  const [customerRemarks, setCustomerRemarks] = useState("");
  const [notes, setNotes] = useState("");
  const [termsAndConditions, setTermsAndConditions] = useState(
    "1. This quotation is valid for the period mentioned above.\n2. Payment terms as agreed.\n3. Prices are exclusive of applicable taxes unless stated otherwise.\n4. Delivery timeline starts from the date of order confirmation and advance payment.\n5. Warranty as specified per product.\n6. Subject to jurisdiction of local courts."
  );

  // Items
  const [items, setItems] = useState<ItemRow[]>([emptyItem()]);

  // Summary
  const [additionalDiscount, setAdditionalDiscount] = useState(0);
  const [shippingCharges, setShippingCharges] = useState(0);
  const [packingCharges, setPackingCharges] = useState(0);
  const [otherCharges, setOtherCharges] = useState(0);
  const [autoRoundOff, setAutoRoundOff] = useState(true);

  const [showDiscount, setShowDiscount] = useState(false);
  const [showCharges, setShowCharges] = useState(false);

  // Load clients list
  useEffect(() => {
    clientService
      .getClients()
      .then(setClients)
      .catch(() => {});
  }, []);

  // Load existing quotation for edit mode
  useEffect(() => {
    if (!isEdit) return;
    setLoading(true);
    quotationService
      .getQuotationById(Number(id))
      .then((q) => {
        if (!q) {
          toast.error("Quotation not found");
          navigate("/admin/quotations");
          return;
        }
        populateForm(q);
      })
      .catch(() => toast.error("Failed to load quotation"))
      .finally(() => setLoading(false));
  }, [id, isEdit, navigate]);

  function populateForm(q: Quotation) {
    const cust = q.customer;
    setCustomer({
      id: cust?.id,
      name: cust?.name || "",
      company: cust?.company || "",
      email: cust?.email || "",
      phone: cust?.phone || "",
      address: cust?.address || "",
      gstNumber: cust?.gstNumber || "",
    });
    if (cust?.id) {
      setSelectedClientId(String(cust.id));
    }
    setShipToName(q.shipToName || "");
    setShipToCompany(q.shipToCompany || "");
    setShipToAddress(q.shipToAddress || "");
    setPlaceOfSupply(q.placeOfSupply || "");
    setQuotationDate(q.quotationDate || today());
    setValidTill(q.validTill || addDays(today(), 30));
    setSalesPerson(q.salesPerson || "");
    setBranch(q.branch || "");
    setCurrency(q.currency || "INR");
    setExchangeRate(q.exchangeRate || 1);
    setReferenceNumber(q.referenceNumber || "");
    setCustomerPoNumber(q.customerPoNumber || "");
    setCustomerPoDate(q.customerPoDate || "");
    setRfqNumber(q.rfqNumber || "");
    setEnquiryNumber(q.enquiryNumber || "");
    setProjectName(q.projectName || "");
    setDeliveryLocation(q.deliveryLocation || "");
    setExpectedDeliveryDate(q.expectedDeliveryDate || "");
    setLeadTime(q.leadTime || "");
    setDeliveryDays(q.deliveryDays || "");
    setPaymentTerms(q.paymentTerms || "");
    setDeliveryTerms(q.deliveryTerms || "");
    setWarranty(q.warranty || "");
    setFreightCharges(q.freightCharges || 0);
    setInstallationCharges(q.installationCharges || 0);
    setInternalRemarks(q.internalRemarks || "");
    setCustomerRemarks(q.customerRemarks || "");
    setNotes(q.notes || "");
    setTermsAndConditions(q.termsAndConditions || "");
    setAdditionalDiscount(q.additionalDiscount || 0);
    setShippingCharges(q.shippingCharges || 0);
    setPackingCharges(q.packingCharges || 0);
    setOtherCharges(q.otherCharges || 0);
    if (q.additionalDiscount > 0) setShowDiscount(true);
    if (q.shippingCharges > 0 || q.packingCharges > 0 || q.otherCharges > 0)
      setShowCharges(true);

    if (q.items && q.items.length > 0) {
      setItems(
        q.items.map((item) => ({
          productName: item.productName || "",
          description: item.description || "",
          hsnSac: item.hsnSac || "",
          warehouse: item.warehouse || "",
          batchNumber: item.batchNumber || "",
          serialNumber: item.serialNumber || "",
          quantity: item.quantity || 1,
          unit: item.unit || "Nos",
          unitPrice: item.unitPrice || 0,
          discountPercent: item.discountPercent || 0,
          taxPercent: item.taxPercent || 18,
          cgst: item.cgst || 0,
          sgst: item.sgst || 0,
          igst: item.igst || 0,
          cess: item.cess || 0,
          remarks: item.remarks || "",
        }))
      );
    }
  }

  function handleClientSelect(clientId: string) {
    setSelectedClientId(clientId);
    const client = clients.find((c) => String(c.id) === clientId);
    if (client) {
      setCustomer({
        id: client.id,
        name: client.name,
        company: client.company,
        email: client.email,
        phone: client.phone,
        address: client.address,
        gstNumber: client.gstNumber || "",
      });
    }
  }

  function handleClientCreated(client: Client) {
    setClients((prev) => {
      const idx = prev.findIndex((c) => c.id === client.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = client;
        return copy;
      }
      return [client, ...prev];
    });
    setSelectedClientId(String(client.id));
    setCustomer({
      id: client.id,
      name: client.name,
      company: client.company,
      email: client.email,
      phone: client.phone,
      address: client.address,
      gstNumber: client.gstNumber || "",
    });
  }

  // Calculations
  const totals = useMemo(() => {
    let subtotal = 0;
    let totalItemDiscount = 0;
    let totalCgst = 0;
    let totalSgst = 0;
    let totalIgst = 0;
    let totalCess = 0;

    for (const item of items) {
      const lineSubtotal = item.quantity * item.unitPrice;
      subtotal += lineSubtotal;
      const discountAmt = (lineSubtotal * item.discountPercent) / 100;
      totalItemDiscount += discountAmt;
      const taxableBase = lineSubtotal - discountAmt;
      const taxAmt = (taxableBase * item.taxPercent) / 100;
      const halfTax = taxAmt / 2;
      totalCgst += item.cgst > 0 ? item.cgst : halfTax;
      totalSgst += item.sgst > 0 ? item.sgst : halfTax;
      totalIgst += item.igst || 0;
      totalCess += item.cess || 0;
    }

    const totalTax = totalCgst + totalSgst + totalIgst + totalCess;
    const totalDiscount = totalItemDiscount + additionalDiscount;
    const taxableAmount = subtotal - totalDiscount;
    const charges =
      shippingCharges +
      packingCharges +
      otherCharges +
      freightCharges +
      installationCharges;
    const beforeRound = taxableAmount + totalTax + charges;
    const roundOff = autoRoundOff
      ? Math.round(beforeRound) - beforeRound
      : 0;
    const grandTotal = beforeRound + roundOff;

    return {
      subtotal,
      totalItemDiscount,
      additionalDiscount,
      totalDiscount,
      taxableAmount,
      cgstTotal: totalCgst,
      sgstTotal: totalSgst,
      igstTotal: totalIgst,
      cessTotal: totalCess,
      totalTax,
      charges,
      roundOff,
      grandTotal,
    };
  }, [
    items,
    additionalDiscount,
    shippingCharges,
    packingCharges,
    otherCharges,
    freightCharges,
    installationCharges,
    autoRoundOff,
  ]);

  function updateItem(index: number, field: keyof ItemRow, value: string | number) {
    setItems((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  }

  function addItem() {
    setItems((prev) => [...prev, emptyItem()]);
  }

  function removeItem(index: number) {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  function duplicateItem(index: number) {
    setItems((prev) => {
      const copy = [...prev];
      copy.splice(index + 1, 0, { ...prev[index] });
      return copy;
    });
  }

  function moveItem(from: number, to: number) {
    if (to < 0 || to >= items.length) return;
    setItems((prev) => {
      const copy = [...prev];
      const [item] = copy.splice(from, 1);
      copy.splice(to, 0, item);
      return copy;
    });
  }

  function validate(): string | null {
    if (!selectedClientId && !customer.name.trim())
      return "Please select a client or register a new one";
    if (!customer.name.trim()) return "Client name is required";
    if (!customer.company.trim()) return "Client company is required";
    if (!customer.email.trim()) return "Client email is required";
    if (!customer.phone.trim()) return "Client phone is required";
    if (!customer.address.trim()) return "Client address is required";
    const validItems = items.filter(
      (i) => i.productName.trim() && i.quantity > 0 && i.unitPrice > 0
    );
    if (validItems.length === 0)
      return "At least one item with a name, quantity > 0, and price > 0 is required";
    return null;
  }

  async function handleSave(status: "draft" | "sent") {
    const error = validate();
    if (error) {
      toast.error(error);
      return;
    }

    setSaving(true);
    try {
      const payload = {
        quotationDate,
        validTill: validTill || null,
        status,
        salesPerson: salesPerson || null,
        branch: branch || null,
        currency,
        exchangeRate,
        referenceNumber: referenceNumber || null,
        customerPoNumber: customerPoNumber || null,
        customerPoDate: customerPoDate || null,
        rfqNumber: rfqNumber || null,
        enquiryNumber: enquiryNumber || null,
        projectName: projectName || null,
        deliveryLocation: deliveryLocation || null,
        expectedDeliveryDate: expectedDeliveryDate || null,
        leadTime: leadTime || null,
        deliveryDays: deliveryDays || null,
        paymentTerms: paymentTerms || null,
        deliveryTerms: deliveryTerms || null,
        warranty: warranty || null,
        freightCharges,
        installationCharges,
        internalRemarks: internalRemarks || null,
        customerRemarks: customerRemarks || null,
        notes: notes || null,
        termsAndConditions: termsAndConditions || null,
        customer: {
          id: customer.id || null,
          name: customer.name,
          company: customer.company,
          email: customer.email,
          phone: customer.phone,
          address: customer.address,
          gstNumber: customer.gstNumber || null,
        },
        shipToName: shipToName || null,
        shipToCompany: shipToCompany || null,
        shipToAddress: shipToAddress || null,
        placeOfSupply: placeOfSupply || null,
        items: items
          .filter((i) => i.productName.trim())
          .map((item, index) => ({
            productName: item.productName,
            description: item.description || null,
            hsnSac: item.hsnSac || null,
            warehouse: item.warehouse || null,
            batchNumber: item.batchNumber || null,
            serialNumber: item.serialNumber || null,
            quantity: clamp(item.quantity, 1, 999999),
            unit: item.unit || null,
            unitPrice: clamp(item.unitPrice, 0.01, 999999999),
            discountPercent: clamp(item.discountPercent, 0, 100),
            taxPercent: clamp(item.taxPercent, 0, 100),
            cgst: item.cgst || 0,
            sgst: item.sgst || 0,
            igst: item.igst || 0,
            cess: item.cess || 0,
            remarks: item.remarks || null,
            sortOrder: index,
          })),
        additionalDiscount,
        shippingCharges,
        packingCharges,
        otherCharges,
        autoRoundOff,
      };

      if (isEdit) {
        await quotationService.updateQuotation(Number(id), payload);
        toast.success("Quotation updated");
      } else {
        await quotationService.createQuotation(payload);
        toast.success("Quotation created");
      }
      navigate("/admin/quotations");
    } catch (error: unknown) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save quotation"
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="h-96 bg-muted rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/admin/quotations")}
        >
          <ArrowLeft className="size-5" />
        </Button>
        <div>
          <h1 className="mb-0">{isEdit ? "Edit Quotation" : "New Quotation"}</h1>
          <p className="text-sm text-muted-foreground">
            {isEdit
              ? "Update quotation details"
              : "Create a new quotation for your client"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left - Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Section 1: Client Selection */}
          <div className="rounded-lg border border-border bg-card p-6">
            <h2 className="text-lg font-semibold mb-4">Client Information</h2>

            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <div className="flex-1">
                <Label>Select Client *</Label>
                <Select
                  value={selectedClientId}
                  onValueChange={handleClientSelect}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a registered client..." />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.name} — {c.company}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={() => setClientDialogOpen(true)}
                >
                  <UserPlus className="size-4 mr-2" />
                  New Client
                </Button>
              </div>
            </div>

            {selectedClientId && (
              <div className="rounded-md border border-border bg-muted/50 p-4 text-sm space-y-1">
                <p>
                  <span className="font-medium">{customer.name}</span>
                  {customer.company && (
                    <span className="text-muted-foreground">
                      {" "}
                      — {customer.company}
                    </span>
                  )}
                </p>
                <p className="text-muted-foreground">{customer.email}</p>
                <p className="text-muted-foreground">{customer.phone}</p>
                <p className="text-muted-foreground whitespace-pre-line">
                  {customer.address}
                </p>
                {customer.gstNumber && (
                  <p className="text-muted-foreground">
                    GST: {customer.gstNumber}
                  </p>
                )}
              </div>
            )}

            {!selectedClientId && clients.length === 0 && (
              <div className="rounded-md border border-dashed border-border p-6 text-center">
                <p className="text-sm text-muted-foreground mb-2">
                  No clients registered yet
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setClientDialogOpen(true)}
                >
                  <UserPlus className="size-4 mr-2" />
                  Register your first client
                </Button>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <div>
                <Label>Place of Supply</Label>
                <Input
                  value={placeOfSupply}
                  onChange={(e) => setPlaceOfSupply(e.target.value)}
                  placeholder="e.g. Maharashtra"
                />
              </div>
            </div>

            <h3 className="text-sm font-semibold mt-6 mb-3 text-muted-foreground">
              Shipping Address
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Name</Label>
                <Input
                  value={shipToName}
                  onChange={(e) => setShipToName(e.target.value)}
                  placeholder="Shipping contact name"
                />
              </div>
              <div>
                <Label>Company</Label>
                <Input
                  value={shipToCompany}
                  onChange={(e) => setShipToCompany(e.target.value)}
                  placeholder="Shipping company"
                />
              </div>
              <div className="sm:col-span-2">
                <Label>Address</Label>
                <Textarea
                  value={shipToAddress}
                  onChange={(e) => setShipToAddress(e.target.value)}
                  placeholder="Shipping address"
                  rows={2}
                />
              </div>
            </div>
          </div>

          {/* Section 2: Quotation Info */}
          <div className="rounded-lg border border-border bg-card p-6">
            <h2 className="text-lg font-semibold mb-4">Quotation Information</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <Label>Quotation Date *</Label>
                <Input
                  type="date"
                  value={quotationDate}
                  onChange={(e) => setQuotationDate(e.target.value)}
                />
              </div>
              <div>
                <Label>Valid Till</Label>
                <Input
                  type="date"
                  value={validTill}
                  onChange={(e) => setValidTill(e.target.value)}
                />
              </div>
              <div>
                <Label>Sales Person</Label>
                <Input
                  value={salesPerson}
                  onChange={(e) => setSalesPerson(e.target.value)}
                  placeholder="Sales person name"
                />
              </div>
              <div>
                <Label>Branch</Label>
                <Input
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  placeholder="Branch"
                />
              </div>
              <div>
                <Label>Currency</Label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INR">INR</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Exchange Rate</Label>
                <Input
                  type="number"
                  value={exchangeRate}
                  onChange={(e) => setExchangeRate(Number(e.target.value))}
                  min={0}
                  step="0.01"
                />
              </div>
              <div>
                <Label>Reference Number</Label>
                <Input
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  placeholder="Reference #"
                />
              </div>
              <div>
                <Label>Client PO Number</Label>
                <Input
                  value={customerPoNumber}
                  onChange={(e) => setCustomerPoNumber(e.target.value)}
                  placeholder="PO Number"
                />
              </div>
              <div>
                <Label>Client PO Date</Label>
                <Input
                  type="date"
                  value={customerPoDate}
                  onChange={(e) => setCustomerPoDate(e.target.value)}
                />
              </div>
              <div>
                <Label>RFQ Number</Label>
                <Input
                  value={rfqNumber}
                  onChange={(e) => setRfqNumber(e.target.value)}
                  placeholder="RFQ #"
                />
              </div>
              <div>
                <Label>Enquiry Number</Label>
                <Input
                  value={enquiryNumber}
                  onChange={(e) => setEnquiryNumber(e.target.value)}
                  placeholder="Enquiry #"
                />
              </div>
              <div>
                <Label>Project Name</Label>
                <Input
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="Project name"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Delivery & Terms */}
          <div className="rounded-lg border border-border bg-card p-6">
            <h2 className="text-lg font-semibold mb-4">Delivery & Terms</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <Label>Delivery Location</Label>
                <Input
                  value={deliveryLocation}
                  onChange={(e) => setDeliveryLocation(e.target.value)}
                  placeholder="Delivery location"
                />
              </div>
              <div>
                <Label>Expected Delivery</Label>
                <Input
                  type="date"
                  value={expectedDeliveryDate}
                  onChange={(e) => setExpectedDeliveryDate(e.target.value)}
                />
              </div>
              <div>
                <Label>Lead Time</Label>
                <Input
                  value={leadTime}
                  onChange={(e) => setLeadTime(e.target.value)}
                  placeholder="e.g. 15 days"
                />
              </div>
              <div>
                <Label>Delivery Days</Label>
                <Input
                  value={deliveryDays}
                  onChange={(e) => setDeliveryDays(e.target.value)}
                  placeholder="e.g. 7 working days"
                />
              </div>
              <div>
                <Label>Payment Terms</Label>
                <Input
                  value={paymentTerms}
                  onChange={(e) => setPaymentTerms(e.target.value)}
                  placeholder="e.g. 50% advance, 50% on delivery"
                />
              </div>
              <div>
                <Label>Delivery Terms</Label>
                <Input
                  value={deliveryTerms}
                  onChange={(e) => setDeliveryTerms(e.target.value)}
                  placeholder="e.g. Ex-Works, FOB"
                />
              </div>
              <div>
                <Label>Warranty</Label>
                <Input
                  value={warranty}
                  onChange={(e) => setWarranty(e.target.value)}
                  placeholder="e.g. 12 months"
                />
              </div>
              <div>
                <Label>Freight Charges</Label>
                <Input
                  type="number"
                  value={freightCharges}
                  onChange={(e) => setFreightCharges(Number(e.target.value))}
                  min={0}
                  step="0.01"
                />
              </div>
              <div>
                <Label>Installation Charges</Label>
                <Input
                  type="number"
                  value={installationCharges}
                  onChange={(e) =>
                    setInstallationCharges(Number(e.target.value))
                  }
                  min={0}
                  step="0.01"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Products & Services */}
          <div className="rounded-lg border border-border bg-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Products & Services</h2>
              <Button variant="outline" size="sm" onClick={addItem}>
                <Plus className="size-4 mr-1" />
                Add Item
              </Button>
            </div>

            <div className="space-y-4">
              {items.map((item, index) => (
                <div
                  key={index}
                  className="border border-border rounded-lg p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className="cursor-grab text-muted-foreground hover:text-foreground"
                        title="Drag to reorder"
                        onDoubleClick={() =>
                          moveItem(index, index > 0 ? index - 1 : index)
                        }
                      >
                        <GripVertical className="size-4" />
                      </button>
                      <span className="text-sm font-medium text-muted-foreground">
                        Item #{index + 1}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Duplicate"
                        onClick={() => duplicateItem(index)}
                      >
                        <Plus className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Remove"
                        onClick={() => removeItem(index)}
                        disabled={items.length <= 1}
                      >
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                    <div className="col-span-2">
                      <Label>Product *</Label>
                      <Input
                        value={item.productName}
                        onChange={(e) =>
                          updateItem(index, "productName", e.target.value)
                        }
                        placeholder="Product name"
                      />
                    </div>
                    <div className="col-span-2">
                      <Label>Description</Label>
                      <Input
                        value={item.description}
                        onChange={(e) =>
                          updateItem(index, "description", e.target.value)
                        }
                        placeholder="Description"
                      />
                    </div>
                    <div>
                      <Label>HSN/SAC</Label>
                      <Input
                        value={item.hsnSac}
                        onChange={(e) =>
                          updateItem(index, "hsnSac", e.target.value)
                        }
                        placeholder="HSN/SAC"
                      />
                    </div>
                    <div>
                      <Label>Warehouse</Label>
                      <Input
                        value={item.warehouse}
                        onChange={(e) =>
                          updateItem(index, "warehouse", e.target.value)
                        }
                        placeholder="Warehouse"
                      />
                    </div>
                    <div>
                      <Label>Batch #</Label>
                      <Input
                        value={item.batchNumber}
                        onChange={(e) =>
                          updateItem(index, "batchNumber", e.target.value)
                        }
                        placeholder="Batch"
                      />
                    </div>
                    <div>
                      <Label>Serial #</Label>
                      <Input
                        value={item.serialNumber}
                        onChange={(e) =>
                          updateItem(index, "serialNumber", e.target.value)
                        }
                        placeholder="Serial"
                      />
                    </div>
                    <div>
                      <Label>Qty *</Label>
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) =>
                          updateItem(
                            index,
                            "quantity",
                            clamp(Number(e.target.value), 1, 999999)
                          )
                        }
                        min={1}
                      />
                    </div>
                    <div>
                      <Label>Unit</Label>
                      <Input
                        value={item.unit}
                        onChange={(e) =>
                          updateItem(index, "unit", e.target.value)
                        }
                        placeholder="Nos"
                      />
                    </div>
                    <div>
                      <Label>Unit Price *</Label>
                      <Input
                        type="number"
                        value={item.unitPrice}
                        onChange={(e) =>
                          updateItem(
                            index,
                            "unitPrice",
                            clamp(Number(e.target.value), 0, 999999999)
                          )
                        }
                        min={0}
                        step="0.01"
                      />
                    </div>
                    <div>
                      <Label>Disc %</Label>
                      <Input
                        type="number"
                        value={item.discountPercent}
                        onChange={(e) =>
                          updateItem(
                            index,
                            "discountPercent",
                            clamp(Number(e.target.value), 0, 100)
                          )
                        }
                        min={0}
                        max={100}
                        step="0.01"
                      />
                    </div>
                    <div>
                      <Label>Tax %</Label>
                      <Input
                        type="number"
                        value={item.taxPercent}
                        onChange={(e) =>
                          updateItem(
                            index,
                            "taxPercent",
                            clamp(Number(e.target.value), 0, 100)
                          )
                        }
                        min={0}
                        max={100}
                        step="0.01"
                      />
                    </div>
                  </div>

                  {/* Tax breakdown row */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    <div>
                      <Label>CGST</Label>
                      <Input
                        type="number"
                        value={item.cgst}
                        onChange={(e) =>
                          updateItem(index, "cgst", Number(e.target.value))
                        }
                        min={0}
                        step="0.01"
                      />
                    </div>
                    <div>
                      <Label>SGST</Label>
                      <Input
                        type="number"
                        value={item.sgst}
                        onChange={(e) =>
                          updateItem(index, "sgst", Number(e.target.value))
                        }
                        min={0}
                        step="0.01"
                      />
                    </div>
                    <div>
                      <Label>IGST</Label>
                      <Input
                        type="number"
                        value={item.igst}
                        onChange={(e) =>
                          updateItem(index, "igst", Number(e.target.value))
                        }
                        min={0}
                        step="0.01"
                      />
                    </div>
                    <div>
                      <Label>CESS</Label>
                      <Input
                        type="number"
                        value={item.cess}
                        onChange={(e) =>
                          updateItem(index, "cess", Number(e.target.value))
                        }
                        min={0}
                        step="0.01"
                      />
                    </div>
                    <div>
                      <Label>Line Total</Label>
                      <Input
                        readOnly
                        value={formatCurrency(
                          (() => {
                            const sub = item.quantity * item.unitPrice;
                            const disc = (sub * item.discountPercent) / 100;
                            const tax =
                              ((sub - disc) * item.taxPercent) / 100;
                            return sub - disc + tax;
                          })()
                        )}
                        className="bg-muted"
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Remarks</Label>
                    <Input
                      value={item.remarks}
                      onChange={(e) =>
                        updateItem(index, "remarks", e.target.value)
                      }
                      placeholder="Item remarks"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 5: Notes & Terms */}
          <div className="rounded-lg border border-border bg-card p-6">
            <h2 className="text-lg font-semibold mb-4">Notes & Remarks</h2>
            <div className="space-y-4">
              <div>
                <Label>Internal Remarks (not visible to client)</Label>
                <Textarea
                  value={internalRemarks}
                  onChange={(e) => setInternalRemarks(e.target.value)}
                  placeholder="Internal notes..."
                  rows={2}
                />
              </div>
              <div>
                <Label>Client Remarks</Label>
                <Textarea
                  value={customerRemarks}
                  onChange={(e) => setCustomerRemarks(e.target.value)}
                  placeholder="Client-facing remarks..."
                  rows={2}
                />
              </div>
              <div>
                <Label>Notes</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Additional notes..."
                  rows={2}
                />
              </div>
              <div>
                <Label>Terms & Conditions</Label>
                <Textarea
                  value={termsAndConditions}
                  onChange={(e) => setTermsAndConditions(e.target.value)}
                  rows={6}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right - Summary Sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-6 space-y-4">
            <div className="rounded-lg border border-border bg-card p-6">
              <h2 className="text-lg font-semibold mb-4">Summary</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatCurrency(totals.subtotal)}</span>
                </div>
                {totals.totalItemDiscount > 0 && (
                  <div className="flex justify-between text-red-500">
                    <span>Item Discount</span>
                    <span>-{formatCurrency(totals.totalItemDiscount)}</span>
                  </div>
                )}

                {!showDiscount ? (
                  <button
                    type="button"
                    className="text-xs text-primary hover:underline"
                    onClick={() => setShowDiscount(true)}
                  >
                    + Add Additional Discount
                  </button>
                ) : (
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-muted-foreground">Add. Discount</span>
                    <Input
                      type="number"
                      value={additionalDiscount}
                      onChange={(e) =>
                        setAdditionalDiscount(Number(e.target.value))
                      }
                      className="w-28 h-8 text-right"
                      min={0}
                      step="0.01"
                    />
                  </div>
                )}

                {!showCharges ? (
                  <button
                    type="button"
                    className="text-xs text-primary hover:underline"
                    onClick={() => setShowCharges(true)}
                  >
                    + Add Charges
                  </button>
                ) : (
                  <>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-muted-foreground">Shipping</span>
                      <Input
                        type="number"
                        value={shippingCharges}
                        onChange={(e) =>
                          setShippingCharges(Number(e.target.value))
                        }
                        className="w-28 h-8 text-right"
                        min={0}
                        step="0.01"
                      />
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-muted-foreground">Packing</span>
                      <Input
                        type="number"
                        value={packingCharges}
                        onChange={(e) =>
                          setPackingCharges(Number(e.target.value))
                        }
                        className="w-28 h-8 text-right"
                        min={0}
                        step="0.01"
                      />
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-muted-foreground">Other</span>
                      <Input
                        type="number"
                        value={otherCharges}
                        onChange={(e) =>
                          setOtherCharges(Number(e.target.value))
                        }
                        className="w-28 h-8 text-right"
                        min={0}
                        step="0.01"
                      />
                    </div>
                  </>
                )}

                <div className="border-t border-border pt-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Taxable Amount</span>
                    <span>{formatCurrency(totals.taxableAmount)}</span>
                  </div>
                </div>

                {totals.cgstTotal > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">CGST</span>
                    <span>{formatCurrency(totals.cgstTotal)}</span>
                  </div>
                )}
                {totals.sgstTotal > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">SGST</span>
                    <span>{formatCurrency(totals.sgstTotal)}</span>
                  </div>
                )}
                {totals.igstTotal > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">IGST</span>
                    <span>{formatCurrency(totals.igstTotal)}</span>
                  </div>
                )}
                {totals.cessTotal > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">CESS</span>
                    <span>{formatCurrency(totals.cessTotal)}</span>
                  </div>
                )}

                <div className="flex items-center gap-2 py-1">
                  <Checkbox
                    checked={autoRoundOff}
                    onCheckedChange={(v) => setAutoRoundOff(v === true)}
                    id="roundoff"
                  />
                  <label
                    htmlFor="roundoff"
                    className="text-xs text-muted-foreground"
                  >
                    Auto Round Off ({totals.roundOff >= 0 ? "+" : ""}
                    {totals.roundOff.toFixed(2)})
                  </label>
                </div>

                <div className="border-t-2 border-border pt-3">
                  <div className="flex justify-between text-base font-bold">
                    <span>Grand Total</span>
                    <span>{formatCurrency(totals.grandTotal)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Info */}
            <div className="rounded-lg border border-border bg-card p-4 text-xs text-muted-foreground space-y-1">
              <p>
                <strong>Date:</strong> {quotationDate}
              </p>
              <p>
                <strong>Valid Till:</strong> {validTill || "-"}
              </p>
              {salesPerson && (
                <p>
                  <strong>Sales Person:</strong> {salesPerson}
                </p>
              )}
              {customer.company && (
                <p>
                  <strong>To:</strong> {customer.company}
                </p>
              )}
              {projectName && (
                <p>
                  <strong>Project:</strong> {projectName}
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2">
              <Button
                onClick={() => handleSave("sent")}
                disabled={saving}
                className="w-full"
              >
                {saving
                  ? "Saving..."
                  : isEdit
                  ? "Update Quotation"
                  : "Create Quotation"}
              </Button>
              <Button
                variant="outline"
                onClick={() => handleSave("draft")}
                disabled={saving}
                className="w-full"
              >
                Save as Draft
              </Button>
              <Button
                variant="ghost"
                onClick={() => navigate("/admin/quotations")}
                className="w-full"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </div>

      <CreateClientDialog
        open={clientDialogOpen}
        onOpenChange={setClientDialogOpen}
        onClientCreated={handleClientCreated}
      />
    </div>
  );
}
