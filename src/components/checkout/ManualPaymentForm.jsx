import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CreditCard, Lock } from "lucide-react";

export default function ManualPaymentForm({ amount, onSuccess, onCancel }) {
  const [formData, setFormData] = useState({
    cardholderName: "",
    cardNumber: "",
    expiry: "",
    cvc: "",
    zip: ""
  });
  const [errors, setErrors] = useState({});
  const [isProcessing, setIsProcessing] = useState(false);

  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || "";
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    return parts.length ? parts.join(" ") : v;
  };

  const formatExpiry = (value) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    if (v.length >= 2) {
      return v.substring(0, 2) + "/" + v.substring(2, 4);
    }
    return v;
  };

  const handleChange = (field, value) => {
    let formattedValue = value;
    if (field === "cardNumber") {
      formattedValue = formatCardNumber(value);
    } else if (field === "expiry") {
      formattedValue = formatExpiry(value.replace("/", ""));
    } else if (field === "cvc") {
      formattedValue = value.replace(/[^0-9]/g, "").substring(0, 4);
    } else if (field === "zip") {
      formattedValue = value.replace(/[^0-9]/g, "").substring(0, 5);
    }
    setFormData((prev) => ({ ...prev, [field]: formattedValue }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.cardholderName.trim()) {
      newErrors.cardholderName = "Name is required";
    }
    if (formData.cardNumber.replace(/\s/g, "").length < 15) {
      newErrors.cardNumber = "Enter a valid card number";
    }
    if (!/^\d{2}\/\d{2}$/.test(formData.expiry)) {
      newErrors.expiry = "Enter MM/YY";
    }
    if (formData.cvc.length < 3) {
      newErrors.cvc = "Enter CVC";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsProcessing(true);
    // Simulate a short delay for UX
    await new Promise((r) => setTimeout(r, 1200));

    // Generate a bypass payment ID
    const bypassId = `bypass_${Date.now()}`;
    onSuccess({ paymentIntentId: bypassId });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
        <Lock className="h-4 w-4" />
        <span>Test Mode – No real charges will be made</span>
      </div>

      <div className="space-y-2">
        <Label htmlFor="cardholderName">Cardholder Name</Label>
        <Input
          id="cardholderName"
          placeholder="John Doe"
          value={formData.cardholderName}
          onChange={(e) => handleChange("cardholderName", e.target.value)}
          className={errors.cardholderName ? "border-destructive" : ""}
        />
        {errors.cardholderName && (
          <p className="text-sm text-destructive">{errors.cardholderName}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="cardNumber">Card Number</Label>
        <div className="relative">
          <Input
            id="cardNumber"
            placeholder="4242 4242 4242 4242"
            value={formData.cardNumber}
            onChange={(e) => handleChange("cardNumber", e.target.value)}
            maxLength={19}
            className={errors.cardNumber ? "border-destructive pr-10" : "pr-10"}
          />
          <CreditCard className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        </div>
        {errors.cardNumber && (
          <p className="text-sm text-destructive">{errors.cardNumber}</p>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="expiry">Expiry</Label>
          <Input
            id="expiry"
            placeholder="MM/YY"
            value={formData.expiry}
            onChange={(e) => handleChange("expiry", e.target.value)}
            maxLength={5}
            className={errors.expiry ? "border-destructive" : ""}
          />
          {errors.expiry && (
            <p className="text-sm text-destructive">{errors.expiry}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="cvc">CVC</Label>
          <Input
            id="cvc"
            placeholder="123"
            value={formData.cvc}
            onChange={(e) => handleChange("cvc", e.target.value)}
            maxLength={4}
            className={errors.cvc ? "border-destructive" : ""}
          />
          {errors.cvc && (
            <p className="text-sm text-destructive">{errors.cvc}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="zip">ZIP</Label>
          <Input
            id="zip"
            placeholder="12345"
            value={formData.zip}
            onChange={(e) => handleChange("zip", e.target.value)}
            maxLength={5}
          />
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isProcessing}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isProcessing} className="flex-1">
          {isProcessing ? "Processing..." : `Pay $${amount.toFixed(2)}`}
        </Button>
      </div>
    </form>
  );
}
