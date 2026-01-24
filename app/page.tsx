"use client";

import { useState } from 'react';

export default function Home() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    userEmail: '',
    zipCode: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState<any[]>([]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResults([]);

    try {
      const response = await fetch('/api/representatives', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle specific Zippopotam 404 errors nicely
        if (response.status === 404 && data.source === 'zippopotam') {
            throw new Error("That Zip Code does not appear to exist in US records. Please check and try again.");
        }
        throw new Error(data.error || 'Something went wrong. Please try again.');
      }

      setResults(data.reps);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Helper for mailto links.
  const createMailtoLink = (repEmail: string, subject: string, body: string) => {
    // We use encodeURIComponent to ensure special characters don't break the link
    return `mailto:${repEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  return (
    <main className="flex min-h-screen flex-col items-center p-4 sm:p-8 bg-gray-50">
      <div className="z-10 max-w-md w-full items-center justify-between font-mono text-sm bg-white p-8 rounded-2xl shadow-xl border border-blue-100">
        <h1 className="text-3xl font-bold mb-3 text-center text-blue-900">Rojava Action Center</h1>
        <p className="mb-8 text-gray-600 text-center text-base leading-relaxed">
          Enter your details below to generate a formal, urgent email to your US Senators regarding the situation in Rojava/NE Syria.
        </p>
        
        <form onSubmit={handleSearch} className="flex flex-col gap-4">
          
          <div className="flex gap-4">
             <input
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleInputChange}
              placeholder="First Name *"
              className="p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-black bg-white w-1/2 transition-all"
              required
            />
            <input
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleInputChange}
              placeholder="Last Name *"
              className="p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-black bg-white w-1/2 transition-all"
              required
            />
          </div>

          <input
            type="email"
            name="userEmail"
            value={formData.userEmail}
            onChange={handleInputChange}
            placeholder="Your Email Address *"
            className="p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-black bg-white transition-all"
            required
          />

          <input
            type="text"
            name="zipCode"
            value={formData.zipCode}
            onChange={handleInputChange}
            placeholder="Zip Code (e.g. 90210) *"
            pattern="[0-9]{5}"
            maxLength={5}
            className="p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-lg text-black bg-white transition-all"
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 text-white font-bold py-4 px-6 mt-4 rounded-lg shadow-md transition-all disabled:opacity-70 text-lg"
          >
            {loading ? 'Locating Senators & Drafting...' : 'Draft My Emails Now'}
          </button>
        </form>

        {error && (
          <div className="mt-6 p-4 bg-red-50 text-red-700 rounded-lg text-center border border-red-200 font-medium">
            {error}
          </div>
        )}

        {results.length > 0 && (
          <div className="mt-8 flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-6 duration-500">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg mb-2">
                <h2 className="text-xl font-bold text-center text-green-900">Senators Found & Emails Ready</h2>
                <p className="text-sm text-green-800 text-center mt-1">Click a button below to open your email app. You can review the text before sending.</p>
            </div>
            
            {results.map((rep, index) => (
              <a
                key={index}
                href={createMailtoLink(rep.email, rep.subject, rep.body)}
                className="block w-full text-center bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-4 rounded-lg shadow-lg transition-transform hover:scale-[1.02] active:scale-95 text-lg"
              >
                Email Senator {rep.name}
              </a>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}