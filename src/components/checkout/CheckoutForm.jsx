import React, { useState, useEffect } from "react";
import {
  PaymentElement,
  useStripe,
  useElements
} from "@stripe/react-stripe-js";
import { Button } from '@/components/ui/button';
import { Loader2, Lock } from 'lucide-react';
import { toast } from "sonner";

export default function CheckoutForm({ amount, onSuccess, onCancel }) {
  const stripe = useStripe();
  const elements = useElements();
  const [message, setMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!stripe) {
      return;
    }

    const clientSecret = new URLSearchParams(window.location.search).get(
      "payment_intent_client_secret"
    );

    if (!clientSecret) {
      return;
    }

    stripe.retrievePaymentIntent(clientSecret).then(({ paymentIntent }) => {
      switch (paymentIntent.status) {
        case "succeeded":
          setMessage("Payment succeeded!");
          break;
        case "processing":
          setMessage("Your payment is processing.");
          break;
        case "requires_payment_method":
          setMessage("Your payment was not successful, please try again.");
          break;
        default:
          setMessage("Something went wrong.");
          break;
      }
    });
  }, [stripe]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) {
      // Stripe.js has not yet loaded.
      return;
    }

    setIsLoading(true);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        // Make sure to change this to your payment completion page or handle redirect
        // For this SPA, we might want to redirect to a success page or handle inline
        return_url: `${window.location.origin}/Account`,
      },
      redirect: 'if_required',
    });

    if (error) {
      if (error.type === "card_error" || error.type === "validation_error") {
        setMessage(error.message);
      } else {
        setMessage("An unexpected error occurred.");
      }
      setIsLoading(false);
    } else if (paymentIntent && paymentIntent.status === "succeeded") {
       // Payment succeeded instantly (no redirect needed)
       onSuccess(paymentIntent);
       setIsLoading(false);
    } else {
       // Handling other statuses or redirects
       setIsLoading(false);
    }
  };

  return (
    <form id="payment-form" onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 flex items-center gap-3 mb-4">
         <Lock className="w-5 h-5 text-blue-600" />
         <div>
            <p className="text-sm font-medium text-blue-900">Secure Payment</p>
            <p className="text-xs text-blue-700">Transactions are encrypted and secured by Stripe.</p>
         </div>
      </div>

      <PaymentElement id="payment-element" options={{layout: "tabs"}} />
      
      {message && <div id="payment-message" className="text-sm text-red-600 bg-red-50 p-3 rounded border border-red-100">{message}</div>}
      
      <div className="flex gap-3 pt-4">
          <Button type="button" variant="outline" className="flex-1" onClick={onCancel} disabled={isLoading}>
             Cancel
          </Button>
          <Button 
            disabled={isLoading || !stripe || !elements} 
            id="submit" 
            className="flex-1 bg-[#8BC34A] hover:bg-[#7CB342] text-white font-bold"
          >
            {isLoading ? (
                <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Processing...
                </>
            ) : (
                `Pay $${amount.toFixed(2)}`
            )}
          </Button>
      </div>
    </form>
  );
}