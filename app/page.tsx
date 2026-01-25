"use client";

import { useState, FormEvent } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { 
  ClipboardDocumentIcon, 
  ArrowTopRightOnSquareIcon, 
  EnvelopeIcon, 
  PrinterIcon, 
  CheckCircleIcon,
  ArrowLeftIcon,
  MapIcon,
  MagnifyingGlassIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PaperAirplaneIcon,
  PhoneIcon // Added Phone Icon
} from '@heroicons/react/24/outline';
import getStripe from '@/lib/stripe';

// --- TYPES ---
type ActionType = 'web' | 'letter' | 'fax' | 'both' | null;
type Step = 'info' | 'selection' | 'web-instructions' | 'preview' | 'payment' | 'success';

// --- PRICING ---
const PRICES = { letter: 2.00, fax: 1.00, both: 3.00 }; 

// --- HELPER COMPONENTS ---

function PaymentForm({ clientSecret, totalAmount, onSuccess, onError }: any) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setIsProcessing(true);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: window.location.origin },
      redirect: 'if_required' 
    });

    if (error) {
      onError(error.message);
      setIsProcessing(false);
    } else if (paymentIntent && paymentIntent.status === 'succeeded') {
      onSuccess();
    } else {
        onError("Payment status unknown. Please check your account.");
        setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md bg-white p-6 rounded-xl shadow-xl border border-blue-100">
      <h3 className="text-xl font-bold text-gray-900 mb-2">Secure Payment</h3>
      <p className="text-gray-500 mb-6 text-sm">Processed securely by Stripe</p>
      <div className="mb-6 bg-gray-50 p-4 rounded-lg flex justify-between items-center border border-gray-200">
        <span className="font-semibold text-gray-700">Total Due:</span>
        <span className="text-xl font-bold text-green-700">${totalAmount.toFixed(2)}</span>
      </div>
      <PaymentElement />
      <button
        type="submit"
        disabled={isProcessing || !stripe}
        className="w-full bg-blue-700 hover:bg-blue-800 text-white font-bold py-4 px-6 mt-6 rounded-xl text-lg shadow-md transition-transform active:scale-95 disabled:opacity-50"
      >
        {isProcessing ? 'Processing...' : `Pay $${totalAmount.toFixed(2)}`}
      </button>
    </form>
  );
}

// --- MAIN COMPONENT ---

export default function Home() {
  const [formData, setFormData] = useState({ firstName: '', lastName: '', userEmail: '', streetAddress: '', city: '', state: '', zipCode: '' });
  const [currentStep, setCurrentStep] = useState<Step>('info');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [senators, setSenators] = useState<any[]>([]);
  const [selectedAction, setSelectedAction] = useState<ActionType>(null);
  const [clientSecret, setClientSecret] = useState('');
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentError, setPaymentError] = useState('');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [activePreviewIndex, setActivePreviewIndex] = useState(0);

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
      if(data.reps[0]) {
        setFormData(prev => ({...prev, state: data.reps[0].userState}));
        const zipResponse = await fetch(`https://api.zippopotam.us/us/${formData.zipCode}`);
        const zipData = await zipResponse.json();
        if (zipData.places && zipData.places[0]) {
            setFormData(prev => ({...prev, city: zipData.places[0]['place name']}));
        }
      }
      setCurrentStep('selection');
    } catch (err: any) { setError(err.message); } finally { setLoading(false); }
  };

  // STEP 2 Handler
  const handleSelection = (action: ActionType) => {
    setSelectedAction(action);
    if (action === 'web') {
        setCurrentStep('web-instructions');
    } else {
        setActivePreviewIndex(0); // Reset to first senator
        setCurrentStep('preview');
    }
  };

  // PREVIEW -> PAYMENT
  const handleConfirmPreview = async () => {
    setLoading(true);
    setPaymentError('');
    try {
      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actionType: selectedAction, senatorCount: senators.length }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to initialize payment.');
      
      setClientSecret(data.clientSecret);
      setPaymentAmount(data.totalAmount / 100);
      setCurrentStep('payment');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // PAYMENT -> SUCCESS
  const handlePaymentSuccess = async () => {
    setLoading(true);
    try {
      if (selectedAction === 'both') {
        // --- LOGIC FOR 'BOTH': CALL LETTER API AND FAX API ---
        const letterReq = fetch('/api/send-letter', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user: formData, senators: senators })
        });

        const faxReq = fetch('/api/send-fax', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user: formData, senators: senators })
        });

        const [letterRes, faxRes] = await Promise.all([letterReq, faxReq]);

        if (!letterRes.ok || !faxRes.ok) {
            throw new Error('Failed to send one or more messages. Please contact support.');
        }

      } else {
        const endpoint = selectedAction === 'letter' ? '/api/send-letter' : '/api/send-fax';
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user: formData, senators: senators }),
        });

        if (!response.ok) throw new Error(`Failed to send.`);
      }
      
      setLoading(false); 
      setCurrentStep('success');

    } catch (err: any) {
      setPaymentError(err.message);
      setLoading(false); 
    }
  };

  const handleRestartKeepData = () => {
    setClientSecret('');
    setPaymentError('');
    setSelectedAction(null);
    setCurrentStep('selection'); 
  };

  const handleFullReset = () => {
    window.location.reload();
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center">
      
      {/* --- BACKGROUND IMAGE --- */}
      <div className="fixed inset-0 z-0">
        <div 
            className="w-full h-full bg-cover bg-center"
            style={{ 
                backgroundImage: "url('https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?q=80&w=2070&auto=format&fit=crop')",
                opacity: 0.35, 
                filter: 'grayscale(100%) contrast(1.1)' 
            }}
        ></div>
        <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px]"></div>
      </div>

      <main className="z-10 w-full max-w-xl p-4 sm:p-6 flex flex-col items-center">
        
        {/* HEADER */}
        <div className="text-center mb-8 mt-4">
            <h1 className="text-3xl font-extrabold text-blue-900 tracking-tight">Rojava Action Center</h1>
            <p className="text-blue-800 font-bold mt-1">Make your voice heard in Washington D.C</p>
        </div>
        
        {error && (
            <div className="w-full mb-6 p-4 bg-red-50 text-red-800 rounded-xl border border-red-200 font-bold text-center shadow-sm">
                {error}
            </div>
        )}

        {/* --- STEP 1: INFO FORM --- */}
        {currentStep === 'info' && !loading && (
          <div className="w-full bg-white/90 backdrop-blur-md p-6 rounded-3xl shadow-xl border border-white ring-1 ring-gray-200 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex items-center gap-3 mb-6 border-b border-gray-200 pb-4">
                <div className="bg-blue-100 p-2 rounded-full"><MapIcon className="h-6 w-6 text-blue-700"/></div>
                <h2 className="text-xl font-bold text-gray-900">Your Information</h2>
            </div>
            
            <form onSubmit={handleFindSenators} className="flex flex-col gap-5">
              <div className="flex gap-4">
                <div className="w-1/2">
                    <input type="text" name="firstName" value={formData.firstName} onChange={handleInputChange} placeholder="First Name" className="w-full p-4 bg-white border-2 border-gray-300 rounded-xl text-gray-900 font-semibold focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none placeholder:text-gray-900 placeholder:font-bold placeholder:opacity-100" required />
                </div>
                <div className="w-1/2">
                    <input type="text" name="lastName" value={formData.lastName} onChange={handleInputChange} placeholder="Last Name" className="w-full p-4 bg-white border-2 border-gray-300 rounded-xl text-gray-900 font-semibold focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none placeholder:text-gray-900 placeholder:font-bold placeholder:opacity-100" required />
                </div>
              </div>
              <input type="email" name="userEmail" value={formData.userEmail} onChange={handleInputChange} placeholder="Email Address" className="w-full p-4 bg-white border-2 border-gray-300 rounded-xl text-gray-900 font-semibold focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none placeholder:text-gray-900 placeholder:font-bold placeholder:opacity-100" required />
              <input type="text" name="streetAddress" value={formData.streetAddress} onChange={handleInputChange} placeholder="Street Address" className="w-full p-4 bg-white border-2 border-gray-300 rounded-xl text-gray-900 font-semibold focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none placeholder:text-gray-900 placeholder:font-bold placeholder:opacity-100" required />
              <input type="text" name="zipCode" value={formData.zipCode} onChange={handleInputChange} placeholder="Zip Code (5-digit)" pattern="[0-9]{5}" maxLength={5} className="w-full p-4 bg-white border-2 border-gray-300 rounded-xl text-gray-900 font-semibold focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none placeholder:text-gray-900 placeholder:font-bold placeholder:opacity-100" required />
              <button type="submit" className="w-full bg-blue-700 hover:bg-blue-800 text-white font-bold py-4 px-6 mt-2 rounded-xl text-lg shadow-lg shadow-blue-200 transition-transform active:scale-95 flex items-center justify-center gap-2">
                <MagnifyingGlassIcon className="h-5 w-5" /> Find My Senators
              </button>
            </form>
          </div>
        )}

        {/* LOADING STATE */}
        {loading && currentStep !== 'success' && (
            <div className="flex flex-col items-center justify-center p-12 bg-white/90 backdrop-blur rounded-3xl shadow-xl">
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-700 mb-6"></div>
                <p className="text-xl text-gray-800 font-bold">Processing...</p>
                <p className="text-gray-500 mt-2">Please wait a moment</p>
            </div>
        )}

        {/* --- STEP 2: SELECTION --- */}
        {currentStep === 'selection' && !loading && (
          <div className="w-full flex flex-col gap-4 animate-in fade-in slide-in-from-right-8">
            <div className="text-center mb-2">
                <h2 className="text-2xl font-bold text-gray-900">Select Action</h2>
                <p className="text-gray-700 font-semibold mt-1">We found <span className="font-extrabold text-blue-800">{senators.length} Senators</span> for {formData.zipCode}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* 1. Both (Premium) */}
                <button onClick={() => handleSelection('both')} className="col-span-1 sm:col-span-2 relative p-6 rounded-2xl shadow-md border-2 border-blue-600 bg-blue-50 hover:bg-blue-100 transition-all text-left active:scale-[0.98] ring-4 ring-blue-50">
                    <div className="absolute top-0 right-0 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-bl-xl rounded-tr-lg">MAXIMUM IMPACT</div>
                    <div className="flex items-center gap-4">
                        <div className="bg-white p-3 rounded-full">
                            <PaperAirplaneIcon className="h-8 w-8 text-blue-700" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">Letter + Fax Bundle</h3>
                            <p className="text-gray-600 text-sm leading-tight mt-1">Send both physical and digital copies for maximum visibility.</p>
                            <span className="inline-block mt-2 font-bold text-blue-800">${PRICES.both.toFixed(2)} / senator</span>
                        </div>
                    </div>
                </button>

                {/* 2. Letter */}
                <button onClick={() => handleSelection('letter')} className="p-5 rounded-2xl shadow-sm border-2 border-gray-100 bg-white hover:border-green-500 transition-all text-left active:scale-[0.98]">
                    <div className="bg-green-100 p-2 rounded-full w-fit mb-3">
                        <EnvelopeIcon className="h-6 w-6 text-green-700" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">Physical Letter</h3>
                    <p className="text-gray-500 text-xs mt-1 mb-2">Printed & mailed to D.C.</p>
                    <span className="font-bold text-green-700 text-sm">${PRICES.letter.toFixed(2)} / letter</span>
                </button>

                {/* 3. Fax */}
                <button onClick={() => handleSelection('fax')} className="p-5 rounded-2xl shadow-sm border-2 border-gray-100 bg-white hover:border-purple-500 transition-all text-left active:scale-[0.98]">
                    <div className="bg-purple-100 p-2 rounded-full w-fit mb-3">
                        <PrinterIcon className="h-6 w-6 text-purple-700" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">Digital Fax</h3>
                    <p className="text-gray-500 text-xs mt-1 mb-2">Instant delivery to office.</p>
                    <span className="font-bold text-purple-700 text-sm">${PRICES.fax.toFixed(2)} / fax</span>
                </button>

                {/* 4. Web */}
                <button onClick={() => handleSelection('web')} className="col-span-1 sm:col-span-2 p-4 rounded-xl border-2 border-gray-100 bg-gray-50 hover:bg-gray-100 transition-all text-left flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-gray-200 p-2 rounded-full">
                            <ArrowTopRightOnSquareIcon className="h-5 w-5 text-gray-600" />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-gray-900">Official Web Form</h3>
                            <p className="text-gray-500 text-xs">Manual copy & paste guide</p>
                        </div>
                    </div>
                    <span className="bg-gray-200 text-gray-700 px-3 py-1 rounded-full text-xs font-bold">FREE</span>
                </button>
            </div>
            
            <button onClick={() => setCurrentStep('info')} className="text-gray-600 font-bold py-4">← Edit My Info</button>
          </div>
        )}

        {/* --- SUB-MENU: WEB INSTRUCTIONS --- */}
        {currentStep === 'web-instructions' && (
            <div className="w-full animate-in fade-in slide-in-from-right-8">
                <button onClick={() => setCurrentStep('selection')} className="flex items-center text-gray-600 font-bold mb-6 hover:text-blue-700">
                    <ArrowLeftIcon className="h-5 w-5 mr-1"/> Back
                </button>

                <div className="bg-blue-50 border-l-4 border-blue-600 p-4 mb-6 rounded-r-lg shadow-sm bg-white/90">
                    <p className="text-blue-900 text-sm">
                        <strong>Instructions:</strong> Click <strong>"Copy Message"</strong>, then click <strong>"Open Website"</strong>. Paste the text into the Senator's contact form.
                    </p>
                    <p className="text-blue-800 text-xs mt-2 italic">
                        If the website form is broken or confusing, please call their office directly using the button below.
                    </p>
                </div>

                <div className="flex flex-col gap-6">
                    {senators.map((rep, index) => (
                        <div key={index} className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                            <div className="bg-gray-50 p-4 border-b border-gray-100">
                                <h3 className="text-lg font-bold text-gray-900">Senator {rep.name}</h3>
                            </div>
                            <div className="p-6 flex flex-col gap-3">
                                <button 
                                    onClick={() => {navigator.clipboard.writeText(rep.body); setCopiedIndex(index); setTimeout(()=>setCopiedIndex(null),3000)}} 
                                    className={`w-full flex items-center justify-center gap-2 font-bold py-4 px-4 rounded-xl transition-all ${copiedIndex === index ? 'bg-green-600 text-white shadow-inner' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}`}
                                >
                                    {copiedIndex === index ? <span className="flex items-center gap-2"><CheckCircleIcon className="h-5 w-5"/> Copied!</span> : <><ClipboardDocumentIcon className="h-5 w-5"/> Copy Message Body</>}
                                </button>
                                
                                <div className="grid grid-cols-2 gap-3 mt-1">
                                    <a 
                                        href={rep.contactUrl} 
                                        target="_blank" 
                                        rel="noopener noreferrer" 
                                        className="flex items-center justify-center gap-2 bg-blue-700 hover:bg-blue-800 text-white font-bold py-4 px-2 rounded-xl shadow-md active:scale-95 transition-all text-sm"
                                    >
                                        <ArrowTopRightOnSquareIcon className="h-5 w-5"/> Open Website
                                    </a>
                                    
                                    {rep.phone ? (
                                        <a 
                                            href={`tel:${rep.phone}`} 
                                            className="flex items-center justify-center gap-2 bg-white border-2 border-blue-700 text-blue-700 hover:bg-blue-50 font-bold py-4 px-2 rounded-xl shadow-sm active:scale-95 transition-all text-sm"
                                        >
                                            <PhoneIcon className="h-5 w-5"/> Call Office
                                        </a>
                                    ) : (
                                        <div className="flex items-center justify-center gap-2 bg-gray-100 text-gray-400 font-bold py-4 px-2 rounded-xl text-sm cursor-not-allowed">
                                            No Phone
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* --- STEP: PREVIEW --- */}
        {currentStep === 'preview' && (
            <div className="w-full animate-in zoom-in-95 duration-300">
                <button onClick={() => setCurrentStep('selection')} className="flex items-center text-gray-600 font-bold mb-4 hover:text-blue-700">
                    <ArrowLeftIcon className="h-5 w-5 mr-1"/> Change Method
                </button>

                <h2 className="text-2xl font-bold text-gray-900 mb-2">Review Document</h2>
                {selectedAction === 'both' ? (
                    <p className="text-gray-600 mb-4 bg-blue-50 p-3 rounded-lg border border-blue-100 text-sm">
                        <strong>Note:</strong> We will send both a physical letter and a digital fax with this content to each senator.
                    </p>
                ) : (
                    <p className="text-gray-600 mb-6">This is how your {selectedAction} will appear.</p>
                )}

                {/* --- TOGGLE BUTTONS FOR MULTIPLE SENATORS --- */}
                {senators.length > 1 && (
                    <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                        {senators.map((sen, idx) => (
                            <button
                                key={idx}
                                onClick={() => setActivePreviewIndex(idx)}
                                className={`px-4 py-2 rounded-full text-sm font-bold border-2 transition-all whitespace-nowrap ${
                                    activePreviewIndex === idx 
                                    ? 'bg-blue-700 text-white border-blue-700' 
                                    : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
                                }`}
                            >
                                To: {sen.name}
                            </button>
                        ))}
                    </div>
                )}

                {/* Document Preview Container */}
                <div className="bg-white p-6 sm:p-10 rounded-xl shadow-xl border border-gray-200 mb-8 max-h-[60vh] overflow-y-auto custom-scrollbar relative">
                    
                    {/* Navigation Arrows inside Preview */}
                    {senators.length > 1 && (
                        <div className="absolute top-1/2 left-0 right-0 flex justify-between px-2 pointer-events-none">
                            <button 
                                onClick={() => setActivePreviewIndex(i => i > 0 ? i - 1 : i)}
                                disabled={activePreviewIndex === 0}
                                className={`p-2 rounded-full bg-gray-800/80 text-white pointer-events-auto transition-opacity ${activePreviewIndex === 0 ? 'opacity-0' : 'opacity-100 hover:bg-black'}`}
                            >
                                <ChevronLeftIcon className="h-6 w-6"/>
                            </button>
                            <button 
                                onClick={() => setActivePreviewIndex(i => i < senators.length - 1 ? i + 1 : i)}
                                disabled={activePreviewIndex === senators.length - 1}
                                className={`p-2 rounded-full bg-gray-800/80 text-white pointer-events-auto transition-opacity ${activePreviewIndex === senators.length - 1 ? 'opacity-0' : 'opacity-100 hover:bg-black'}`}
                            >
                                <ChevronRightIcon className="h-6 w-6"/>
                            </button>
                        </div>
                    )}

                    {/* Simulated Paper Header */}
                    <div className="border-b-2 border-gray-800 mb-6 pb-2 flex justify-between items-end">
                        <div className="text-sm font-serif text-gray-600 uppercase tracking-widest">
                            {selectedAction === 'fax' ? 'Facsimile Transmission' : 'Official Correspondence'}
                        </div>
                        <div className="font-bold font-serif text-xl">US SENATE</div>
                    </div>

                    {/* Paper Body */}
                    <div className="font-serif text-gray-900 space-y-4 text-sm sm:text-base leading-relaxed">
                        <div className="flex flex-col sm:flex-row justify-between text-gray-500 text-xs sm:text-sm mb-8">
                            <div>
                                <p className="font-bold text-gray-900">{formData.firstName} {formData.lastName}</p>
                                <p>{formData.streetAddress}</p>
                                <p>{formData.city}, {formData.state} {formData.zipCode}</p>
                                <p>{formData.userEmail}</p>
                            </div>
                            <div className="mt-4 sm:mt-0 text-left sm:text-right">
                                <p>{new Date().toLocaleDateString()}</p>
                            </div>
                        </div>

                        
                        
                        {/* Header line removed because it is now inside the body */}
<div className="whitespace-pre-wrap font-medium">
    {senators[activePreviewIndex]?.body || "Loading message preview..."}
</div>

                    
                    </div>
                </div>

                <div className="sticky bottom-4">
                    <button 
                        onClick={handleConfirmPreview} 
                        className="w-full font-bold py-4 px-6 rounded-xl text-lg shadow-xl bg-blue-700 hover:bg-blue-800 text-white transform transition-all hover:-translate-y-1"
                    >
                        Looks Good! Proceed to Pay
                    </button>
                </div>
            </div>
        )}

        {/* --- STEP 3: PAYMENT FORM --- */}
        {currentStep === 'payment' && clientSecret && (
            <div className="w-full flex flex-col items-center animate-in fade-in">
                <button onClick={() => setCurrentStep('preview')} className="self-start flex items-center text-gray-600 font-bold mb-6 hover:text-blue-700">
                    <ArrowLeftIcon className="h-5 w-5 mr-1"/> Back to Preview
                </button>
                
                {paymentError && <div className="w-full mb-6 p-4 bg-red-100 text-red-700 rounded-xl text-center border border-red-300 font-semibold">{paymentError}</div>}
                
                <Elements stripe={getStripe()} options={{ clientSecret }}>
                    <PaymentForm 
                        clientSecret={clientSecret} 
                        totalAmount={paymentAmount}
                        onSuccess={handlePaymentSuccess}
                        onError={setPaymentError}
                    />
                </Elements>
            </div>
        )}

        {/* --- STEP 4: SUCCESS MESSAGE --- */}
        {currentStep === 'success' && (
             <div className="w-full bg-white/95 backdrop-blur p-8 sm:p-12 rounded-3xl shadow-2xl border border-green-100 flex flex-col items-center animate-in zoom-in-95 duration-500">
                <div className="bg-green-100 p-4 rounded-full mb-6">
                    <CheckCircleIcon className="h-16 w-16 text-green-600" />
                </div>
                <h2 className="text-3xl font-extrabold text-gray-900 mb-4 text-center">Message Sent!</h2>
                <div className="bg-green-50 p-6 rounded-xl w-full mb-8 text-center">
                    <p className="text-lg text-gray-800 font-medium">
                        {selectedAction === 'both' ? 'Your Letters and Faxes have been queued.' : `Your ${selectedAction === 'letter' ? 'physical letters' : 'faxes'} have been queued.`}
                    </p>
                    <p className="text-sm text-gray-500 mt-2">
                        Sent to {senators.length} Senators.
                    </p>
                </div>
                <p className="text-gray-600 text-center mb-8 px-4">
                    Thank you for taking a stand. Your support makes a difference for human rights in Rojava.
                </p>
                
                {/* RESTART (Keep Data) */}
                <button onClick={handleRestartKeepData} className="w-full bg-blue-700 hover:bg-blue-800 text-white font-bold py-4 px-8 rounded-xl text-lg shadow-lg mb-4">
                    Send Another Message
                </button>
                
                {/* FULL RESET */}
                <button onClick={handleFullReset} className="text-gray-400 text-sm hover:text-gray-600 hover:underline">
                    Clear Info & Start Over
                </button>
             </div>
        )}

      </main>
    </div>
  );
}