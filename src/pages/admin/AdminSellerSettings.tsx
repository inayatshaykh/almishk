import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Building2, Save, Loader2 } from 'lucide-react';

interface SellerSettings {
  id?: string;
  company_name: string;
  gstin: string;
  pan: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  email: string;
  bank_name: string;
  bank_account: string;
  bank_ifsc: string;
  logo_url: string;
}

const defaultSettings: SellerSettings = {
  company_name: '',
  gstin: '',
  pan: '',
  address: '',
  city: '',
  state: '',
  pincode: '',
  phone: '',
  email: '',
  bank_name: '',
  bank_account: '',
  bank_ifsc: '',
  logo_url: '',
};

const AdminSellerSettings = () => {
  const [settings, setSettings] = useState<SellerSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    const { data, error } = await supabase
      .from('seller_settings')
      .select('*')
      .limit(1)
      .maybeSingle();

    if (!error && data) {
      setSettings(data);
    }
    setIsLoading(false);
  };

  const handleChange = (field: keyof SellerSettings, value: string) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!settings.company_name || !settings.gstin || !settings.address) {
      toast.error('Please fill in required fields: Company Name, GSTIN, Address');
      return;
    }

    setIsSaving(true);

    if (settings.id) {
      // Update existing
      const { error } = await supabase
        .from('seller_settings')
        .update({
          company_name: settings.company_name,
          gstin: settings.gstin,
          pan: settings.pan,
          address: settings.address,
          city: settings.city,
          state: settings.state,
          pincode: settings.pincode,
          phone: settings.phone,
          email: settings.email,
          bank_name: settings.bank_name,
          bank_account: settings.bank_account,
          bank_ifsc: settings.bank_ifsc,
          logo_url: settings.logo_url,
        })
        .eq('id', settings.id);

      if (error) {
        toast.error('Failed to save settings');
      } else {
        toast.success('Settings saved successfully');
      }
    } else {
      // Insert new
      const { data, error } = await supabase
        .from('seller_settings')
        .insert({
          company_name: settings.company_name,
          gstin: settings.gstin,
          pan: settings.pan,
          address: settings.address,
          city: settings.city,
          state: settings.state,
          pincode: settings.pincode,
          phone: settings.phone,
          email: settings.email,
          bank_name: settings.bank_name,
          bank_account: settings.bank_account,
          bank_ifsc: settings.bank_ifsc,
          logo_url: settings.logo_url,
        })
        .select()
        .single();

      if (error) {
        toast.error('Failed to save settings');
      } else {
        setSettings(data);
        toast.success('Settings saved successfully');
      }
    }

    setIsSaving(false);
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-4xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-headline text-3xl text-gradient-gold">Seller Settings</h1>
            <p className="text-muted-foreground mt-1">Configure your business details for GST invoices</p>
          </div>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Settings
          </Button>
        </div>

        <div className="grid gap-6">
          {/* Company Details */}
          <Card className="card-luxury">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                Company Details
              </CardTitle>
              <CardDescription>Your registered business information for invoices</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company_name">Company Name *</Label>
                  <Input
                    id="company_name"
                    value={settings.company_name}
                    onChange={(e) => handleChange('company_name', e.target.value)}
                    placeholder="Your Company Pvt. Ltd."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gstin">GSTIN *</Label>
                  <Input
                    id="gstin"
                    value={settings.gstin}
                    onChange={(e) => handleChange('gstin', e.target.value.toUpperCase())}
                    placeholder="29AAAAA0000A1Z5"
                    maxLength={15}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pan">PAN</Label>
                  <Input
                    id="pan"
                    value={settings.pan}
                    onChange={(e) => handleChange('pan', e.target.value.toUpperCase())}
                    placeholder="AAAAA0000A"
                    maxLength={10}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={settings.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    placeholder="+91 98765 43210"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={settings.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="contact@company.com"
                />
              </div>
            </CardContent>
          </Card>

          {/* Address */}
          <Card className="card-luxury">
            <CardHeader>
              <CardTitle>Registered Address</CardTitle>
              <CardDescription>Your business address for invoice header</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="address">Address *</Label>
                <Textarea
                  id="address"
                  value={settings.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                  placeholder="123, Business Park, Main Road"
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={settings.city}
                    onChange={(e) => handleChange('city', e.target.value)}
                    placeholder="Mumbai"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    value={settings.state}
                    onChange={(e) => handleChange('state', e.target.value)}
                    placeholder="Maharashtra"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pincode">Pincode</Label>
                  <Input
                    id="pincode"
                    value={settings.pincode}
                    onChange={(e) => handleChange('pincode', e.target.value)}
                    placeholder="400001"
                    maxLength={6}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bank Details */}
          <Card className="card-luxury">
            <CardHeader>
              <CardTitle>Bank Details</CardTitle>
              <CardDescription>Bank information displayed on invoices for payments</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bank_name">Bank Name</Label>
                  <Input
                    id="bank_name"
                    value={settings.bank_name}
                    onChange={(e) => handleChange('bank_name', e.target.value)}
                    placeholder="State Bank of India"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bank_account">Account Number</Label>
                  <Input
                    id="bank_account"
                    value={settings.bank_account}
                    onChange={(e) => handleChange('bank_account', e.target.value)}
                    placeholder="1234567890123"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bank_ifsc">IFSC Code</Label>
                  <Input
                    id="bank_ifsc"
                    value={settings.bank_ifsc}
                    onChange={(e) => handleChange('bank_ifsc', e.target.value.toUpperCase())}
                    placeholder="SBIN0001234"
                    maxLength={11}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Logo */}
          <Card className="card-luxury">
            <CardHeader>
              <CardTitle>Logo</CardTitle>
              <CardDescription>Company logo URL for invoice header</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="logo_url">Logo URL</Label>
                <Input
                  id="logo_url"
                  value={settings.logo_url}
                  onChange={(e) => handleChange('logo_url', e.target.value)}
                  placeholder="https://your-domain.com/logo.png"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminSellerSettings;
