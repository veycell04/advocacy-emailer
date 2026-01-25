"use client";

import { useState, FormEvent } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { ClipboardDocumentIcon, ArrowTopRightOnSquareIcon, EnvelopeIcon, PrinterIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import getStripe from '@/lib/stripe';

// --- TYPES ---
type ActionType = 'web' | 'letter' | 'fax' | null;
type Step = 'info' | 'selection' | 'payment' | 'success';

// --- PRICING ---
const PRICES = { letter: 2.00, fax: 1.00 }; // User-facing prices

// --- HELPER COMPONENTS ---

// PaymentForm: The Stripe credit card input
function PaymentForm({ clientSecret, totalAmount, onSuccess, onError }: any) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setIsProcessing(true);

    // Confirm the payment with Stripe
    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        // This url is required but won't be used in our flow.
        return_url: window.location.origin,
      },
      redirect: 'if_required' // Crucial: Don't redirect away from the page
    });

    if (error) {
      onError(error.message);
      setIsProcessing(false);
    } else if (paymentIntent && paymentIntent.status === 'succeeded') {
      // Payment succeeded! Tell the parent component.
      onSuccess();
    } else {
        onError("Payment status unknown. Please check your account.");
        setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md bg-white p-6 rounded-xl shadow-lg border border-gray-200">
      <h3 className="text-xl font-bold text-gray-900 mb-4">Complete Your Payment</h3>
      <p className="text-lg font-semibold text-gray-700 mb-6">Total: ${totalAmount.toFixed(2)}</p>
      {/* The Stripe Element automatically renders Apple/Google Pay or Credit Card fields */}
      <PaymentElement />
      <button
        type="submit"
        disabled={isProcessing || !stripe}
        className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-6 mt-6 rounded-lg text-lg disabled:opacity-50"
      >
        {isProcessing ? 'Processing...' : `Pay $${totalAmount.toFixed(2)} & Send`}
      </button>
    </form>
  );
}


// --- MAIN COMPONENT ---

export default function Home() {
  // User Info State
  const [formData, setFormData] = useState({ firstName: '', lastName: '', userEmail: '', streetAddress: '', city: '', state: '', zipCode: '' });
  
  // App Flow State
  const [currentStep, setCurrentStep] = useState<Step>('info');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [senators, setSenators] = useState<any[]>([]);
  const [selectedAction, setSelectedAction] = useState<ActionType>(null);
  
  // Payment State
  const [clientSecret, setClientSecret] = useState('');
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentError, setPaymentError] = useState('');

  // UI Helper State
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, [e.target.name]: e.target.value });

  // STEP 1 -> STEP 2: Find Senators
  const handleFindSenators = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const response = await fetch('/api/representatives', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Something went wrong.');
      setSenators(data.reps);
      // Store state/city from backend response to use in shipping address for letters
      if(data.reps[0]) {
        setFormData(prev => ({...prev, state: data.reps[0].userState}));
        // NOTE: Zippopotam gives a list of places. For simplicity, we use the first one's city name.
        // In a real app, you might let the user confirm the city.
        const zipResponse = await fetch(`https://api.zippopotam.us/us/${formData.zipCode}`);
        const zipData = await zipResponse.json();
        setFormData(prev => ({...prev, city: zipData.places[0]['place name']}));
      }
      setCurrentStep('selection');
    } catch (err: any) { setError(err.message); } finally { setLoading(false); }
  };

  // STEP 2 -> STEP 3 (or SUCCESS): Action Selected
  const handleActionSelect = async (action: ActionType) => {
    setSelectedAction(action);
    setPaymentError('');

    if (action === 'web') {
        // No payment needed, just show the copy-paste UI (which is part of the 'selection' step view)
        return; 
    }

    // For paid actions, get payment intent from backend
    setLoading(true);
    try {
      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actionType: action, senatorCount: senators.length }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to initialize payment.');
      
      setClientSecret(data.clientSecret);
      setPaymentAmount(data.totalAmount / 100); // Convert cents to dollars for display
      setCurrentStep('payment');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // STEP 3 -> SUCCESS: Payment Complete, Trigger Backend
  const handlePaymentSuccess = async () => {
    setLoading(true);
    setCurrentStep('info'); // Hide payment form temporarily
    const endpoint = selectedAction === 'letter' ? '/api/send-letter' : '/api/send-fax';
    
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Send user data and senator data to the backend route
        body: JSON.stringify({ user: formData, senators: senators }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || `Failed to send ${selectedAction}s.`);
      
      setCurrentStep('success');
    } catch (err: any) {
      setError(err.message);
      setCurrentStep('selection'); // Go back so they can try again
    } finally {
      setLoading(false);
    }
  };

  // --- UI RENDERING ---

  return (
    <main className="flex min-h-screen flex-col items-center p-4 sm:p-8 bg-gray-50">
      <div className="z-10 w-full max-w-2xl items-center justify-between font-mono text-sm">
        <h1 className="text-3xl font-bold mb-8 text-center text-blue-900">Rojava Support Action Center</h1>
        
        {error && <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-xl text-center border border-red-300 font-semibold shadow-sm">{error}</div>}

        {/* STEP 1: INFO FORM */}
        {currentStep === 'info' && !loading && (
          <div className="bg-white p-8 rounded-2xl shadow-xl border border-blue-100">
            <p className="mb-6 text-gray-600 text-center text-base">
              Enter your information to identify your Senators and prepare your message.
            </p>
            <form onSubmit={handleFindSenators} className="flex flex-col gap-4">
              <div className="flex gap-4">
                <input 
                  type="text" 
                  name="firstName" 
                  value={formData.firstName} 
                  onChange={handleInputChange} 
                  placeholder="First Name *" 
                  className="p-4 border rounded-lg w-1/2 placeholder:text-gray-500 placeholder:font-bold" 
                  required 
                />
                <input 
                  type="text" 
                  name="lastName" 
                  value={formData.lastName} 
                  onChange={handleInputChange} 
                  placeholder="Last Name *" 
                  className="p-4 border rounded-lg w-1/2 placeholder:text-gray-500 placeholder:font-bold" 
                  required 
                />
              </div>
              <input 
                type="email" 
                name="userEmail" 
                value={formData.userEmail} 
                onChange={handleInputChange} 
                placeholder="Email Address *" 
                className="p-4 border rounded-lg placeholder:text-gray-500 placeholder:font-bold" 
                required 
              />
              <input 
                type="text" 
                name="streetAddress" 
                value={formData.streetAddress} 
                onChange={handleInputChange} 
                placeholder="Street Address *" 
                className="p-4 border rounded-lg placeholder:text-gray-500 placeholder:font-bold" 
                required 
              />
              <input 
                type="text" 
                name="zipCode" 
                value={formData.zipCode} 
                onChange={handleInputChange} 
                placeholder="Zip Code (5-digit) *" 
                pattern="[0-9]{5}" 
                maxLength={5} 
                className="p-4 border rounded-lg text-lg placeholder:text-gray-500 placeholder:font-bold" 
                required 
              />
              <button type="submit" disabled={loading} className="bg-blue-700 hover:bg-blue-800 text-white font-bold py-4 px-6 mt-4 rounded-xl text-lg">
                Continue
              </button>
            </form>
          </div>
        )}

        {/* LOADING STATE */}
        {loading && (
            <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl shadow-xl">
                <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-700 mb-4"></div>
                <p className="text-xl text-gray-700 font-semibold">Processing...</p>
            </div>
        )}

        {/* STEP 2: SELECTION & WEB FORM UI */}
        {currentStep === 'selection' && !loading && (
          <div className="flex flex-col gap-8 animate-in fade-in">
            <h2 className="text-2xl font-bold text-center text-gray-900">Choose How to Send Your Message</h2>
            <p className="text-center text-gray-600">Sending to: <span className="font-semibold">{senators.map(s => s.name).join(' & ')}</span></p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Option A: Web Form */}
                <button onClick={() => setSelectedAction('web')} className={`p-6 rounded-xl border-2 text-left transition-all ${selectedAction === 'web' ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-200' : 'border-gray-200 bg-white hover:border-blue-400'}`}>
                    <ArrowTopRightOnSquareIcon className="h-10 w-10 text-blue-600 mb-3" />
                    <h3 className="text-xl font-bold text-gray-900">Official Web Form</h3>
                    <p className="text-gray-600 mt-2 text-sm">Copy & paste the message onto their official website.</p>
                    <p className="font-bold text-blue-700 mt-4">Free</p>
                </button>
                {/* Option B: Physical Letter */}
                <button onClick={() => handleActionSelect('letter')} className="p-6 rounded-xl border-2 border-gray-200 bg-white hover:border-green-400 text-left transition-all">
                    <EnvelopeIcon className="h-10 w-10 text-green-600 mb-3" />
                    <h3 className="text-xl font-bold text-gray-900">Physical Letter</h3>
                    <p className="text-gray-600 mt-2 text-sm">We print and mail a real letter to their D.C. office.</p>
                    <p className="font-bold text-green-700 mt-4">${PRICES.letter.toFixed(2)} / letter</p>
                </button>
                {/* Option C: Fax */}
                <button onClick={() => handleActionSelect('fax')} className="p-6 rounded-xl border-2 border-gray-200 bg-white hover:border-purple-400 text-left transition-all">
                    <PrinterIcon className="h-10 w-10 text-purple-600 mb-3" />
                    <h3 className="text-xl font-bold text-gray-900">Digital Fax</h3>
                    <p className="text-gray-600 mt-2 text-sm">We send a digital fax directly to their office machine.</p>
                    <p className="font-bold text-purple-700 mt-4">${PRICES.fax.toFixed(2)} / fax</p>
                </button>
            </div>

            {/* WEB FORM COPY-PASTE UI (Shows if 'web' is selected) */}
            {selectedAction === 'web' && (
                <div className="mt-8 flex flex-col gap-6 animate-in slide-in-from-bottom-4">
                    <div className="p-4 bg-blue-100 border-l-4 border-blue-600 text-blue-900 rounded-r-md">
                        <strong>Instructions:</strong> For each senator, click <strong>"Copy"</strong>, then <strong>"Open Website"</strong>, and paste the message into their form.
                    </div>
                    {senators.map((rep, index) => (
                    <div key={index} className="border-2 border-blue-200 rounded-xl p-6 bg-white shadow-md">
                        <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">Senator {rep.name}</h3>
                        <div className="flex flex-col gap-3">
                            <button onClick={() => {navigator.clipboard.writeText(rep.body); setCopiedIndex(index); setTimeout(()=>setCopiedIndex(null),3000)}} className={`flex items-center justify-center gap-2 font-bold py-3 px-4 rounded-lg transition-all ${copiedIndex === index ? 'bg-green-600 text-white' : 'bg-blue-100 text-blue-800 hover:bg-blue-200'}`}>
                                {copiedIndex === index ? <>✅ Copied!</> : <><ClipboardDocumentIcon className="h-6 w-6"/> 1. Copy Message</>}
                            </button>
                            <a href={rep.contactUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 bg-blue-700 hover:bg-blue-800 text-white font-bold py-3 px-4 rounded-lg">
                                <ArrowTopRightOnSquareIcon className="h-6 w-6"/> 2. Open Website
                            </a>
                        </div>
                    </div>
                    ))}
                </div>
            )}
            
            <button onClick={() => setCurrentStep('info')} className="text-gray-500 underline text-center mt-4">Start Over</button>
          </div>
        )}

        {/* STEP 3: PAYMENT FORM */}
        {currentStep === 'payment' && clientSecret && (
            <div className="flex flex-col items-center animate-in fade-in">
                {paymentError && <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-xl text-center border border-red-300">{paymentError}</div>}
                <Elements stripe={getStripe()} options={{ clientSecret }}>
                    <PaymentForm 
                        clientSecret={clientSecret} 
                        totalAmount={paymentAmount}
                        onSuccess={handlePaymentSuccess}
                        onError={setPaymentError}
                    />
                </Elements>
                <button onClick={() => setCurrentStep('selection')} className="text-gray-500 underline text-center mt-8">Back to Options</button>
            </div>
        )}

        {/* STEP 4: SUCCESS MESSAGE */}
        {currentStep === 'success' && (
             <div className="bg-white p-12 rounded-2xl shadow-xl border-2 border-green-100 flex flex-col items-center animate-in fade-in zoom-in">
                <CheckCircleIcon className="h-24 w-24 text-green-600 mb-6" />
                <h2 className="text-3xl font-bold text-gray-900 mb-4 text-center">Success!</h2>
                <p className="text-xl text-gray-700 text-center mb-8">
                    Your {selectedAction === 'letter' ? 'physical letters' : 'faxes'} have been successfully queued for delivery to your Senators.
                </p>
                <p className="text-gray-600 text-center">Thank you for taking action.</p>
                <button onClick={() => window.location.reload()} className="bg-blue-700 hover:bg-blue-800 text-white font-bold py-4 px-8 mt-8 rounded-xl text-lg">
                    Start Over
                </button>
             </div>
        )}

      </div>
    </main>
  );
}