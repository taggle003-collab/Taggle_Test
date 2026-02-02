'use client';

import { useState, useEffect } from 'react';
import { Mail, Plus, Trash2, Edit2, Check, X, Send, Clock, Filter, FileText } from 'lucide-react';

export interface EmailAutomationRule {
  id: string;
  name: string;
  enabled: boolean;
  trigger: {
    type: 'criteria';
    conditions: {
      field: 'country' | 'industry' | 'companySize' | 'leadScore';
      operator: 'equals' | 'contains' | 'greaterThan' | 'lessThan';
      value: string;
    }[];
  };
  action: {
    type: 'sendEmail';
    templateId: string;
    delayMinutes?: number;
  };
  stats: {
    runs: number;
    successes: number;
    failures: number;
    lastRun?: string;
  };
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  variables: string[];
  isCustom: boolean;
}

interface EmailAutomationProps {
  userPlan: 'solo' | 'pro';
  userEmail?: string;
  onSave?: (rule: EmailAutomationRule) => void;
  onDelete?: (ruleId: string) => void;
}

const DEFAULT_TEMPLATES: EmailTemplate[] = [
  {
    id: 'welcome',
    name: 'Welcome Follow-up',
    subject: 'Great connecting with you, {lead.name}!',
    body: 'Hi {lead.name},\\n\\nI noticed your company {lead.company} in the {lead.industry} space and wanted to reach out.\\n\\nBest regards,\\n{user.name}',
    variables: ['lead.name', 'lead.company', 'lead.industry', 'user.name'],
    isCustom: false,
  },
  {
    id: 'demo',
    name: 'Demo Request',
    subject: 'Personalized demo for {lead.company}',
    body: 'Hi {lead.name},\\n\\nI\'d love to show you how we can help {lead.company} achieve its goals in the {lead.industry} industry.\\n\\nWould you be open to a brief 15-minute call?\\n\\nBest,\\n{user.name}',
    variables: ['lead.name', 'lead.company', 'lead.industry', 'user.name'],
    isCustom: false,
  },
  {
    id: 'partnership',
    name: 'Partnership Opportunity',
    subject: 'Partnership opportunity with {lead.company}',
    body: 'Hi {lead.name},\\n\\nI see tremendous potential for a partnership between our companies. Given your role at {lead.company}, I believe you\'d be the perfect person to discuss this with.\\n\\nLooking forward to connecting,\\n{user.name}',
    variables: ['lead.name', 'lead.company', 'user.name'],
    isCustom: false,
  },
];

export function EmailAutomation({ userPlan, userEmail, onSave, onDelete }: EmailAutomationProps) {
  const [rules, setRules] = useState<EmailAutomationRule[]>([]);
  const [templates, setTemplates] = useState<EmailTemplate[]>(DEFAULT_TEMPLATES);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingRule, setEditingRule] = useState<EmailAutomationRule | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    conditions: [{ field: 'country' as const, operator: 'equals' as const, value: '' }] as EmailAutomationRule['trigger']['conditions'],
    templateId: 'welcome',
    delayMinutes: 0,
  });

  const maxRules = userPlan === 'solo' ? 5 : 999;
  const canCreateMore = rules.length < maxRules;

  useEffect(() => {
    // Load existing rules from localStorage or API
    const savedRules = localStorage.getItem('emailAutomationRules');
    if (savedRules) {
      try {
        setRules(JSON.parse(savedRules));
      } catch (e) {
        console.error('Failed to load rules:', e);
      }
    }
  }, []);

  useEffect(() => {
    // Save rules to localStorage
    if (rules.length > 0) {
      localStorage.setItem('emailAutomationRules', JSON.stringify(rules));
    }
  }, [rules]);

  const handleCreateRule = () => {
    if (!formData.name.trim()) {
      alert('Please enter a rule name');
      return;
    }

    if (formData.conditions.some(c => !c.value.trim())) {
      alert('Please complete all conditions');
      return;
    }

    const newRule: EmailAutomationRule = {
      id: Date.now().toString(),
      name: formData.name,
      enabled: true,
      trigger: {
        type: 'criteria',
        conditions: formData.conditions,
      },
      action: {
        type: 'sendEmail',
        templateId: formData.templateId,
        delayMinutes: formData.delayMinutes,
      },
      stats: {
        runs: 0,
        successes: 0,
        failures: 0,
      },
    };

    setRules([...rules, newRule]);
    onSave?.(newRule);
    setShowCreateModal(false);
    setFormData({
      name: '',
      conditions: [{ field: 'country', operator: 'equals', value: '' }],
      templateId: 'welcome',
      delayMinutes: 0,
    });
  };

  const handleUpdateRule = () => {
    if (!editingRule || !formData.name.trim()) return;

    const updatedRule: EmailAutomationRule = {
      ...editingRule,
      name: formData.name,
      trigger: {
        ...editingRule.trigger,
        conditions: formData.conditions,
      },
      action: {
        ...editingRule.action,
        templateId: formData.templateId,
        delayMinutes: formData.delayMinutes,
      },
    };

    setRules(rules.map(r => r.id === editingRule.id ? updatedRule : r));
    onSave?.(updatedRule);
    setEditingRule(null);
    setFormData({
      name: '',
      conditions: [{ field: 'country', operator: 'equals', value: '' }],
      templateId: 'welcome',
      delayMinutes: 0,
    });
  };

  const handleDeleteRule = (ruleId: string) => {
    if (confirm('Are you sure you want to delete this automation rule?')) {
      setRules(rules.filter(r => r.id !== ruleId));
      onDelete?.(ruleId);
    }
  };

  const toggleRule = (ruleId: string) => {
    setRules(rules.map(r => 
      r.id === ruleId ? { ...r, enabled: !r.enabled } : r
    ));
  };

  const addCondition = () => {
    setFormData({
      ...formData,
      conditions: [...formData.conditions, { field: 'country', operator: 'equals', value: '' }],
    });
  };

  const removeCondition = (index: number) => {
    setFormData({
      ...formData,
      conditions: formData.conditions.filter((_, i) => i !== index),
    });
  };

  const updateCondition = (index: number, field: string, value: string) => {
    const newConditions = [...formData.conditions];
    newConditions[index] = { ...newConditions[index], [field]: value };
    setFormData({ ...formData, conditions: newConditions });
  };

  const openCreateModal = () => {
    setEditingRule(null);
    setFormData({
      name: '',
      conditions: [{ field: 'country', operator: 'equals', value: '' }],
      templateId: 'welcome',
      delayMinutes: 0,
    });
    setShowCreateModal(true);
  };

  const openEditModal = (rule: EmailAutomationRule) => {
    setEditingRule(rule);
    setFormData({
      name: rule.name,
      conditions: rule.trigger.conditions,
      templateId: rule.action.templateId,
      delayMinutes: rule.action.delayMinutes || 0,
    });
    setShowCreateModal(true);
  };

  const selectedTemplate = templates.find(t => t.id === formData.templateId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Email Automations</h2>
          <p className="text-gray-400 mt-1">
            {userPlan === 'solo' 
              ? `Solo Plan: ${rules.length}/${maxRules} automations used` 
              : 'Pro Plan: Unlimited automations'}
          </p>
        </div>
        
        <button
          onClick={openCreateModal}
          disabled={!canCreateMore && userPlan === 'solo'}
          className="bg-[#FF6B35] hover:bg-[#e55a2b] disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus size={20} />
          Create Automation
        </button>
      </div>

      {/* Rules List */}
      {rules.length === 0 ? (
        <div className="bg-[#1a1a1a] rounded-lg border border-gray-700 p-12 text-center">
          <Mail size={48} className="text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No automations yet</h3>
          <p className="text-gray-400 mb-6">
            Create your first email automation to automatically reach out to leads matching your criteria.
          </p>
          <button
            onClick={openCreateModal}
            className="bg-[#FF6B35] hover:bg-[#e55a2b] text-white px-6 py-3 rounded-lg transition-colors"
          >
            Create First Automation
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {rules.map(rule => (
            <div key={rule.id} className="bg-[#1a1a1a] rounded-lg border border-gray-700 p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-white">{rule.name}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      rule.enabled 
                        ? 'bg-green-900/40 text-green-400 border border-green-800/60' 
                        : 'bg-gray-800/40 text-gray-400 border border-gray-700'
                    }`}>
                      {rule.enabled ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  
                  <div className="text-sm text-gray-400">
                    <p className="flex items-center gap-2 mb-1">
                      <Filter size={14} />
                      When: {rule.trigger.conditions.map((c, i) => 
                        `${c.field} ${c.operator} "${c.value}"`
                      ).join(' AND ')}
                    </p>
                    <p className="flex items-center gap-2">
                      <Send size={14} />
                      Action: Send "{templates.find(t => t.id === rule.action.templateId)?.name}" 
                      {rule.action.delayMinutes && `after ${rule.action.delayMinutes} minutes`}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleRule(rule.id)}
                    className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                    title={rule.enabled ? 'Pause' : 'Activate'}
                  >
                    {rule.enabled ? 
                      <Check size={16} className="text-green-400" /> : 
                      <X size={16} className="text-gray-400" />
                    }
                  </button>
                  
                  <button
                    onClick={() => openEditModal(rule)}
                    className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Edit2 size={16} className="text-gray-400" />
                  </button>
                  
                  <button
                    onClick={() => handleDeleteRule(rule.id)}
                    className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={16} className="text-red-400" />
                  </button>
                </div>
              </div>
              
              {/* Stats */}
              <div className="grid grid-cols-4 gap-4 pt-4 border-t border-gray-700">
                <div>
                  <div className="text-2xl font-bold text-[#FF6B35]">{rule.stats.runs}</div>
                  <div className="text-xs text-gray-400">Total Runs</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-400">{rule.stats.successes}</div>
                  <div className="text-xs text-gray-400">Successful</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-red-400">{rule.stats.failures}</div>
                  <div className="text-xs text-gray-400">Failed</div>
                </div>
                {rule.stats.lastRun && (
                  <div>
                    <div className="text-sm text-white">{new Date(rule.stats.lastRun).toLocaleDateString()}</div>
                    <div className="text-xs text-gray-400">Last Run</div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#2a2a2a] rounded-lg border border-gray-700 p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-white mb-6">
              {editingRule ? 'Edit Automation' : 'Create New Automation'}
            </h3>
            
            <div className="space-y-6">
              {/* Rule Name */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Automation Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-gray-800 text-white border border-gray-600 rounded-lg px-3 py-2"
                  placeholder="e.g., Auto-follow up US Tech Leads"
                />
              </div>
              
              {/* Trigger Conditions */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Trigger Conditions
                </label>
                
                <div className="space-y-3">
                  {formData.conditions.map((condition, index) => (
                    <div key={index} className="flex gap-2">
                      <select
                        value={condition.field}
                        onChange={(e) => updateCondition(index, 'field', e.target.value)}
                        className="bg-gray-800 text-white border border-gray-600 rounded-lg px-3 py-2 w-32"
                      >
                        <option value="country">Country</option>
                        <option value="industry">Industry</option>
                        <option value="companySize">Company Size</option>
                        {userPlan === 'pro' && <option value="leadScore">Lead Score</option>}
                      </select>
                      
                      <select
                        value={condition.operator}
                        onChange={(e) => updateCondition(index, 'operator', e.target.value)}
                        className="bg-gray-800 text-white border border-gray-600 rounded-lg px-3 py-2 w-32"
                      >
                        <option value="equals">Equals</option>
                        <option value="contains">Contains</option>
                        {condition.field === 'leadScore' && <option value="greaterThan">Greater Than</option>}
                        {condition.field === 'leadScore' && <option value="lessThan">Less Than</option>}
                      </select>
                      
                      <input
                        type="text"
                        value={condition.value}
                        onChange={(e) => updateCondition(index, 'value', e.target.value)}
                        className="flex-1 bg-gray-800 text-white border border-gray-600 rounded-lg px-3 py-2"
                        placeholder="Value..."
                      />
                      
                      {formData.conditions.length > 1 && (
                        <button
                          onClick={() => removeCondition(index)}
                          className="p-2 hover:bg-gray-700 rounded-lg text-red-400 transition-colors"
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                
                <button
                  onClick={addCondition}
                  className="mt-3 text-sm text-[#FF6B35] hover:text-[#e55a2b] transition-colors"
                >
                  + Add Condition
                </button>
              </div>
              
              {/* Email Template */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email Template
                </label>
                <select
                  value={formData.templateId}
                  onChange={(e) => setFormData({ ...formData, templateId: e.target.value })}
                  className="w-full bg-gray-800 text-white border border-gray-600 rounded-lg px-3 py-2"
                >
                  {templates.map(template => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                    </option>
                  ))}
                </select>
                
                {selectedTemplate && (
                  <div className="mt-4 p-4 bg-gray-800/50 rounded-lg border border-gray-600">
                    <div className="text-sm text-gray-300 mb-2">
                      <strong className="text-white">Subject:</strong> {selectedTemplate.subject}
                    </div>
                    <div className="text-sm text-gray-300">
                      <strong className="text-white">Body:</strong>
                      <pre className="mt-2 whitespace-pre-wrap font-sans">{selectedTemplate.body}</pre>
                    </div>
                    <div className="mt-3 text-xs text-gray-400">
                      Variables: {selectedTemplate.variables.join(', ')}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Delay */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Delay (minutes)
                </label>
                <input
                  type="number"
                  value={formData.delayMinutes}
                  onChange={(e) => setFormData({ ...formData, delayMinutes: parseInt(e.target.value) || 0 })}
                  className="w-full bg-gray-800 text-white border border-gray-600 rounded-lg px-3 py-2"
                  placeholder="0"
                  min="0"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Delay before sending the email (0 = send immediately)
                </p>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-8">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={editingRule ? handleUpdateRule : handleCreateRule}
                className="bg-[#FF6B35] hover:bg-[#e55a2b] text-white px-6 py-2 rounded-lg transition-colors"
              >
                {editingRule ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper function to test if a lead matches automation rules
export const testLeadAgainstRules = (
  lead: any,
  rules: EmailAutomationRule[]
): EmailAutomationRule[] => {
  return rules.filter(rule => {
    if (!rule.enabled) return false;
    
    return rule.trigger.conditions.every(condition => {
      const leadValue = lead[condition.field];
      if (!leadValue) return false;
      
      switch (condition.operator) {
        case 'equals':
          return leadValue.toString().toLowerCase() === condition.value.toLowerCase();
        case 'contains':
          return leadValue.toString().toLowerCase().includes(condition.value.toLowerCase());
        case 'greaterThan':
          return parseFloat(leadValue) > parseFloat(condition.value);
        case 'lessThan':
          return parseFloat(leadValue) < parseFloat(condition.value);
        default:
          return false;
      }
    });
  });
};

// Helper function to process automation for a lead
export const processLeadAutomation = async (
  lead: any,
  rule: EmailAutomationRule,
  userEmail: string,
  template: EmailTemplate
) => {
  try {
    // Simulate email sending (in real app, this would call your email API)
    console.log(`[Automation] Sending email to ${lead.email} using template: ${template.name}`);
    
    // Replace variables in template
    const personalizedSubject = template.subject.replace(/{lead\.name}/g, lead.name)
      .replace(/{lead\.company}/g, lead.company)
      .replace(/{lead\.industry}/g, lead.industry || '')
      .replace(/{user\.name}/g, userEmail.split('@')[0]);
    
    const personalizedBody = template.body.replace(/{lead\.name}/g, lead.name)
      .replace(/{lead\.company}/g, lead.company)
      .replace(/{lead\.industry}/g, lead.industry || '')
      .replace(/{user\.name}/g, userEmail.split('@')[0]);
    
    // Simulate delay if specified
    if (rule.action.delayMinutes && rule.action.delayMinutes > 0) {
      console.log(`[Automation] Waiting ${rule.action.delayMinutes} minutes before sending...`);
    }
    
    // Here you would integrate with Resend or your email provider
    // const response = await fetch('/api/send-automated-email', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({
    //     to: lead.email,
    //     subject: personalizedSubject,
    //     body: personalizedBody,
    //     from: userEmail,
    //   }),
    // });
    
    console.log(`[Automation] Email sent successfully to ${lead.email}`);
    console.log(`Subject: ${personalizedSubject}`);
    console.log(`Body: ${personalizedBody}`);
    
    return { success: true };
  } catch (error) {
    console.error(`[Automation] Failed to send email to ${lead.email}:`, error);
    return { success: false, error };
  }
};
