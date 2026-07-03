import { useState } from "react";
import { useNavigate } from "react-router";
import { repairOrderService, RepairOrder } from "../services/repairOrderService";
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { ArrowLeft, Plus, X } from "lucide-react";
import { toast } from "sonner";

const MACHINE_CATEGORIES = [
  "CNC Machines",
  "Robotics",
  "Presses",
  "Injection Molding",
  "Welding Equipment",
  "Packaging Machines",
  "Conveyors",
  "Power Tools",
  "Electronics",
  "Hydraulic Systems",
];

const COMPANIES = ["TECHsolution", "Skillful Technology Pvt Ltd"];

export function RepairOrderCreate() {
  const navigate = useNavigate();

  const [company, setCompany] = useState("");

  const [customer, setCustomer] = useState({
    companyName: "",
    contactPerson: "",
    email: "",
    phone: "",
    address: "",
  });

  const [machine, setMachine] = useState({
    name: "",
    manufacturer: "",
    modelNumber: "",
    serialNumber: "",
    category: "",
  });

  const [service, setService] = useState({
    problemDescription: "",
    customerComplaint: "",
    accessoriesReceived: [] as string[],
    initialInspectionNotes: "",
  });

  const [accessoryInput, setAccessoryInput] = useState("");

  const addAccessory = () => {
    if (accessoryInput.trim()) {
      setService({
        ...service,
        accessoriesReceived: [...service.accessoriesReceived, accessoryInput.trim()],
      });
      setAccessoryInput("");
    }
  };

  const removeAccessory = (index: number) => {
    setService({
      ...service,
      accessoriesReceived: service.accessoriesReceived.filter((_, i) => i !== index),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!company) {
      toast.error("Please select which company this repair order belongs to");
      return;
    }

    try {
      const repairOrder: Omit<RepairOrder, "id" | "repairOrderNumber" | "statusHistory"> = {
        company,
        customer,
        machine,
        service,
        status: "received",
        receivedDate: new Date().toISOString().split("T")[0],
        createdBy: "Admin User",
        partsUsed: [],
        financial: {
          repairRevenue: 0,
          outsourcingCost: 0,
          partsCost: 0,
          labourCost: 0,
          totalCost: 0,
          profit: 0,
        },
      };

      const created = await repairOrderService.createRepairOrder(repairOrder);
      toast.success("Repair order created successfully");
      navigate(`/admin/repair-orders/${created.id}`);
    } catch (error) {
      toast.error("Failed to create repair order");
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/admin/repair-orders")}
        >
          <ArrowLeft className="size-5" />
        </Button>
        <div>
          <h1 className="mb-1">New Repair Order</h1>
          <p className="text-muted-foreground">Register a new machine for repair</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Company Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Company</CardTitle>
            <CardDescription>Select which company this repair order belongs to</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="company">Company *</Label>
              <Select value={company} onValueChange={setCompany}>
                <SelectTrigger id="company">
                  <SelectValue placeholder="Select company" />
                </SelectTrigger>
                <SelectContent>
                  {COMPANIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Customer Information */}
        <Card>
          <CardHeader>
            <CardTitle>Customer Information</CardTitle>
            <CardDescription>Details of the customer bringing the machine</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name *</Label>
                <Input
                  id="companyName"
                  value={customer.companyName}
                  onChange={(e) => setCustomer({ ...customer, companyName: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactPerson">Contact Person *</Label>
                <Input
                  id="contactPerson"
                  value={customer.contactPerson}
                  onChange={(e) => setCustomer({ ...customer, contactPerson: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={customer.email}
                  onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  value={customer.phone}
                  onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address *</Label>
              <Textarea
                id="address"
                value={customer.address}
                onChange={(e) => setCustomer({ ...customer, address: e.target.value })}
                required
              />
            </div>
          </CardContent>
        </Card>

        {/* Machine Information */}
        <Card>
          <CardHeader>
            <CardTitle>Machine Information</CardTitle>
            <CardDescription>Details of the machine for repair</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="machineName">Machine Name *</Label>
                <Input
                  id="machineName"
                  value={machine.name}
                  onChange={(e) => setMachine({ ...machine, name: e.target.value })}
                  placeholder="e.g., CNC Milling Machine"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="manufacturer">Manufacturer *</Label>
                <Input
                  id="manufacturer"
                  value={machine.manufacturer}
                  onChange={(e) => setMachine({ ...machine, manufacturer: e.target.value })}
                  placeholder="e.g., Haas Automation"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="modelNumber">Model Number *</Label>
                <Input
                  id="modelNumber"
                  value={machine.modelNumber}
                  onChange={(e) => setMachine({ ...machine, modelNumber: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="serialNumber">Serial Number *</Label>
                <Input
                  id="serialNumber"
                  value={machine.serialNumber}
                  onChange={(e) => setMachine({ ...machine, serialNumber: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Machine Category *</Label>
              <Select
                value={machine.category}
                onValueChange={(value) => setMachine({ ...machine, category: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {MACHINE_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Service Information */}
        <Card>
          <CardHeader>
            <CardTitle>Service Information</CardTitle>
            <CardDescription>Problem description and initial notes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="problemDescription">Problem Description *</Label>
              <Textarea
                id="problemDescription"
                value={service.problemDescription}
                onChange={(e) =>
                  setService({ ...service, problemDescription: e.target.value })
                }
                placeholder="Describe the technical issue"
                rows={3}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="customerComplaint">Customer Complaint *</Label>
              <Textarea
                id="customerComplaint"
                value={service.customerComplaint}
                onChange={(e) =>
                  setService({ ...service, customerComplaint: e.target.value })
                }
                placeholder="What the customer reported"
                rows={3}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Accessories Received</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="e.g., Tool holders, Manual, Keys"
                  value={accessoryInput}
                  onChange={(e) => setAccessoryInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addAccessory())}
                />
                <Button type="button" onClick={addAccessory}>
                  <Plus className="size-4" />
                </Button>
              </div>

              {service.accessoriesReceived.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {service.accessoriesReceived.map((accessory, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 px-3 py-1 bg-accent rounded-lg"
                    >
                      <span className="text-sm">{accessory}</span>
                      <button
                        type="button"
                        onClick={() => removeAccessory(index)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <X className="size-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="initialInspectionNotes">Initial Inspection Notes</Label>
              <Textarea
                id="initialInspectionNotes"
                value={service.initialInspectionNotes}
                onChange={(e) =>
                  setService({ ...service, initialInspectionNotes: e.target.value })
                }
                placeholder="First observations about the machine condition"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/admin/repair-orders")}
          >
            Cancel
          </Button>
          <Button type="submit">Create Repair Order</Button>
        </div>
      </form>
    </div>
  );
}