import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Save, Store, Loader2 } from 'lucide-react';

interface StoreSettings {
  brand_name: string;
  tagline: string;
  store_address: string;
  store_email: string;
  store_phone: string;
  whatsapp_number: string;
  instagram_url: string;
  facebook_url: string;
  about_text: string;
}

const AdminStoreSettings = () => {
  const [settings, setSettings] = useState<StoreSettings>({
    brand_name: '',
    tagline: '',
    store_address: '',
    store_email: '',
    store_phone: '',
    whatsapp_number: '',
    instagram_url: '',
    facebook_url: '',
    about_text: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await supabase.from('store_settings').select('*');
      if (data) {
        const settingsMap: Record<string, string> = {};
        data.forEach((item: { setting_key: string; setting_value: string | null }) => {
          settingsMap[item.setting_key] = item.setting_value || '';
        });
        setSettings((prev) => ({ ...prev, ...settingsMap }));
      }
      setIsLoading(false);
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);

    try {
      const updates = Object.entries(settings).map(([key, value]) =>
        supabase
          .from('store_settings')
          .upsert({ setting_key: key, setting_value: value }, { onConflict: 'setting_key' })
      );

      await Promise.all(updates);
      toast.success('Settings saved successfully');
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (key: keyof StoreSettings, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-headline text-3xl text-gradient-gold">Store Settings</h1>
            <p className="text-muted-foreground mt-1">Manage website branding and contact information</p>
          </div>
          <Button onClick={handleSave} disabled={isSaving} className="bg-primary hover:bg-primary/90">
            {isSaving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Settings
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Branding */}
          <Card className="card-luxury">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Store className="h-5 w-5 text-primary" />
                Branding
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Brand Name</Label>
                <Input
                  value={settings.brand_name}
                  onChange={(e) => handleChange('brand_name', e.target.value)}
                  placeholder="Al Mishk"
                />
              </div>
              <div className="space-y-2">
                <Label>Tagline</Label>
                <Input
                  value={settings.tagline}
                  onChange={(e) => handleChange('tagline', e.target.value)}
                  placeholder="Premium Attar & Fragrances"
                />
              </div>
              <div className="space-y-2">
                <Label>About Text</Label>
                <Textarea
                  value={settings.about_text}
                  onChange={(e) => handleChange('about_text', e.target.value)}
                  placeholder="Tell customers about your brand..."
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          {/* Contact */}
          <Card className="card-luxury">
            <CardHeader>
              <CardTitle className="text-lg">Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Store Address</Label>
                <Textarea
                  value={settings.store_address}
                  onChange={(e) => handleChange('store_address', e.target.value)}
                  placeholder="Full store address..."
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label>Phone Number</Label>
                <Input
                  value={settings.store_phone}
                  onChange={(e) => handleChange('store_phone', e.target.value)}
                  placeholder="+91 XXXXX XXXXX"
                />
              </div>
              <div className="space-y-2">
                <Label>WhatsApp Number</Label>
                <Input
                  value={settings.whatsapp_number}
                  onChange={(e) => handleChange('whatsapp_number', e.target.value)}
                  placeholder="+91 XXXXX XXXXX"
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={settings.store_email}
                  onChange={(e) => handleChange('store_email', e.target.value)}
                  placeholder="contact@almishk.com"
                />
              </div>
            </CardContent>
          </Card>

          {/* Social Media */}
          <Card className="card-luxury md:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">Social Media</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Instagram URL</Label>
                <Input
                  value={settings.instagram_url}
                  onChange={(e) => handleChange('instagram_url', e.target.value)}
                  placeholder="https://instagram.com/almishk"
                />
              </div>
              <div className="space-y-2">
                <Label>Facebook URL</Label>
                <Input
                  value={settings.facebook_url}
                  onChange={(e) => handleChange('facebook_url', e.target.value)}
                  placeholder="https://facebook.com/almishk"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminStoreSettings;
