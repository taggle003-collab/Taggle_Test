"use client";

import { useState } from "react";
import { Loader2, Search, Mail, Download, AlertCircle } from "lucide-react";

interface Lead {
  name: string;
  email: string;
  company: string;
  phone: string;
  position: string;
  location: string;
}

export default function LeadScraping() {
  const [url, setUrl] = useState("");
  const [isScraping, setIsScraping] = useState(false);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [email, setEmail] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Mock lead scraping function (in real implementation, this would call a scraping service)
  const scrapeLeads = async () => {
    if (!url.trim()) {
      setError("Please enter a website URL or search criteria");
      return;
    }

    setIsScraping(true);
    setError("");
    setMessage("");

    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Mock scraped leads data
      const mockLeads: Lead[] = [
        {
          name: "John Smith",
          email: "john.smith@techcorp.com",
          company: "TechCorp Solutions",
          phone: "+1 (555) 123-4567",
          position: "Marketing Director",
          location: "San Francisco, CA"
        },
        {
          name: "Sarah Johnson",
          email: "sarah.j@digitalagency.co",
          company: "Digital Agency Co",
          phone: "+1 (555) 987-6543",
          position: "CEO",
          location: "New York, NY"
        },
        {
          name: "Mike Chen",
          email: "mike.chen@innovate.io",
          company: "Innovate IO",
          phone: "+1 (555) 456-7890",
          position: "CTO",
          location: "Austin, TX"
        },
        {
          name: "Emily Rodriguez",
          email: "emily.r@startupxyz.com",
          company: "Startup XYZ",
          phone: "+1 (555) 321-0987",
          position: "VP Sales",
          location: "Los Angeles, CA"
        },
        {
          name: "David Wilson",
          email: "david.wilson@enterprise.org",
          company: "Enterprise Corp",
          phone: "+1 (555) 654-3210",
          position: "Operations Manager",
          location: "Chicago, IL"
        }
      ];

      setLeads(mockLeads);
      setMessage(`Successfully scraped ${mockLeads.length} leads from ${url}`);
    } catch (err) {
      setError("Failed to scrape leads. Please try again.");
    } finally {
      setIsScraping(false);
    }
  };

  // Send leads via email
  const sendLeadsEmail = async () => {
    if (!email.trim()) {
      setError("Please enter your email address");
      return;
    }

    if (leads.length === 0) {
      setError("No leads to send. Please scrape leads first.");
      return;
    }

    setIsSending(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/send-leads-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          leads,
          userName: "User", // In real app, get from auth context
          userEmail: email,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(`✅ Successfully sent ${leads.length} leads to ${email}!`);
        setEmail("");
      } else {
        setError(data.error || "Failed to send email. Please try again.");
      }
    } catch (err) {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setIsSending(false);
    }
  };

  // Clear all data
  const clearData = () => {
    setLeads([]);
    setUrl("");
    setEmail("");
    setMessage("");
    setError("");
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <div className="flex items-center gap-3 mb-6">
        <Search className="w-6 h-6 text-orange-600" />
        <h2 className="text-2xl font-bold text-white">Lead Scraping</h2>
      </div>

      <p className="text-gray-400 mb-6">
        Enter a website URL or search criteria to scrape leads. Then export them to your email.
      </p>

      {/* URL Input */}
      <div className="mb-6">
        <label htmlFor="url" className="block text-sm font-medium text-gray-300 mb-2">
          Website URL or Search Criteria
        </label>
        <div className="flex gap-3">
          <input
            type="text"
            id="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com or 'marketing directors in tech companies'"
            className="flex-1 px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-600 focus:border-transparent"
            disabled={isScraping}
          />
          <button
            onClick={scrapeLeads}
            disabled={isScraping}
            className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-semibold"
          >
            {isScraping ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Scraping...
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                Scrape Leads
              </>
            )}
          </button>
        </div>
      </div>

      {/* Messages */}
      {message && (
        <div className="mb-4 p-4 bg-green-900/30 border border-green-600 rounded-lg">
          <p className="text-green-200">{message}</p>
        </div>
      )}

      {error && (
        <div className="mb-4 p-4 bg-red-900/30 border border-red-600 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
          <p className="text-red-200">{error}</p>
        </div>
      )}

      {/* Leads Table */}
      {leads.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">
              Scraped Leads ({leads.length})
            </h3>
            <button
              onClick={clearData}
              className="text-gray-400 hover:text-white text-sm"
            >
              Clear All
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full bg-gray-700 rounded-lg overflow-hidden">
              <thead className="bg-gray-600">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Company
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Phone
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Position
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Location
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-600">
                {leads.map((lead, index) => (
                  <tr key={index} className="hover:bg-gray-600">
                    <td className="px-4 py-3 text-sm text-white">{lead.name}</td>
                    <td className="px-4 py-3 text-sm text-blue-300">{lead.email}</td>
                    <td className="px-4 py-3 text-sm text-gray-300">{lead.company}</td>
                    <td className="px-4 py-3 text-sm text-gray-300">{lead.phone}</td>
                    <td className="px-4 py-3 text-sm text-gray-300">{lead.position}</td>
                    <td className="px-4 py-3 text-sm text-gray-300">{lead.location}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Email Export Section */}
      {leads.length > 0 && (
        <div className="border-t border-gray-600 pt-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Export to Email
          </h3>
          
          <p className="text-gray-400 mb-4">
            Send these leads to your email address with a CSV attachment and formatted table.
          </p>

          <div className="flex gap-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your-email@example.com"
              className="flex-1 px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-600 focus:border-transparent"
              disabled={isSending}
            />
            <button
              onClick={sendLeadsEmail}
              disabled={isSending || !email.trim()}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-semibold"
            >
              {isSending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4" />
                  Send to Email
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}