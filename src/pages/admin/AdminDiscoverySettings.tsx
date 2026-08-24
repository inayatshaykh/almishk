import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Beaker, Save, Package } from 'lucide-react';

const AdminDiscoverySettings = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [enabled, setEnabled] = useState(true);
  const [slots, setSlots] = useState(5);
  const [price, setPrice] = useState('');
  const [discount, setDiscount] = useState(0);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('store_settings')
      .select('setting_key, setting_value')
      .in('setting_key', [
        'discovery_set_enabled',
        'discovery_set_slots',
        'discovery_set_price',
        'discovery_set_discount'
      ]);

    if (error) {
      toast.error('Failed to load settings');
      setIsLoading(false);
      return;
    }

    const settings: Record<string, string> = {};
    (data || []).forEach(s => {
      if (s.setting_value) settings[s.setting_key] = s.setting_value;
    });

    setEnabled(settings['discovery_set_enabled'] !== 'false');
    setSlots(parseInt(settings['discovery_set_slots'] || '5'));
    setPrice(settings['discovery_set_price'] || '');
    setDiscount(parseFloat(settings['discovery_set_discount'] || '0'));
    setIsLoading(false);
  };

  const handleSave = async () => {
    setIsSaving(true);

    const settings = [
      { key: 'discovery_set_enabled', value: enabled.toString() },
      { key: 'discovery_set_slots', value: slots.toString() },
      { key: 'discovery_set_price', value: price },
      { key: 'discovery_set_discount', value: discount.toString() }
    ];

    const errors: string[] = [];

    for (const setting of settings) {
      // Check if setting exists
      const { data: existing } = await supabase
        .from('store_settings')
        .select('id')
        .eq('setting_key', setting.key)
        .maybeSingle();

      if (existing) {
        // Update existing
        const { error } = await supabase
          .from('store_settings')
          .update({ setting_value: setting.value })
          .eq('setting_key', setting.key);
        
        if (error) errors.push(`Failed to update ${setting.key}`);
      } else {
        // Insert new
        const { error } = await supabase
          .from('store_settings')
          .insert({ setting_key: setting.key, setting_value: setting.value });
        
        if (error) errors.push(`Failed to insert ${setting.key}`);
      }
    }

    setIsSaving(false);

    if (errors.length > 0) {
      toast.error(errors.join(', '));
    } else {
      toast.success('Discovery Set settings saved!');
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-headline text-3xl text-gradient-gold flex items-center gap-2">
            <Beaker className="h-8 w-8" />
            Discovery Set Settings
          </h1>
          <p className="text-muted-foreground mt-1">
            Configure the Discovery Set builder for customers
          </p>
        </div>

        <Card className="card-luxury">
          <CardHeader>
            <CardTitle>Discovery Set Configuration</CardTitle>
            <CardDescription>
              Customize how customers build their discovery sets
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Enable/Disable */}
            <div className="flex items-center justify-between p-4 border border-primary/20 rounded-lg">
              <div className="space-y-0.5">
                <Label htmlFor="enabled" className="text-base font-medium">
                  Enable Discovery Sets
                </Label>
                <p className="text-sm text-muted-foreground">
                  Allow customers to build custom discovery sets
                </p>
              </div>
              <Switch
                id="enabled"
                checked={enabled}
                onCheckedChange={setEnabled}
              />
            </div>

            {/* Number of Slots */}
            <div className="space-y-2">
              <Label htmlFor="slots">Number of Slots</Label>
              <p className="text-sm text-muted-foreground">
                How many perfumes can customers select in a discovery set?
              </p>
              <Input
                id="slots"
                type="number"
                min="1"
                max="10"
                value={slots}
                onChange={(e) => setSlots(parseInt(e.target.value) || 1)}
                className="max-w-xs"
              />
              <p className="text-xs text-muted-foreground">
                Recommended: 3-5 slots
              </p>
            </div>

            {/* Set Price */}
            <div className="space-y-2">
              <Label htmlFor="price">Fixed Set Price (Optional)</Label>
              <p className="text-sm text-muted-foreground">
                Override individual product prices with a fixed set price. Leave empty to sum individual prices.
              </p>
              <div className="relative max-w-xs">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  ₹
                </span>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Auto-calculate from products"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="pl-7"
                />
              </div>
            </div>

            {/* Discount */}
            <div className="space-y-2">
              <Label htmlFor="discount">Discount Percentage</Label>
              <p className="text-sm text-muted-foreground">
                Apply a percentage discount to the discovery set total
              </p>
              <div className="relative max-w-xs">
                <Input
                  id="discount"
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  value={discount}
                  onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                  className="pr-8"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  %
                </span>
              </div>
            </div>

            {/* Preview */}
            <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Package className="h-4 w-4 text-primary" />
                Preview
              </div>
              <div className="text-sm space-y-1">
                <p>
                  <span className="text-muted-foreground">Status:</span>{' '}
                  <span className={enabled ? 'text-emerald-600' : 'text-muted-foreground'}>
                    {enabled ? 'Enabled' : 'Disabled'}
                  </span>
                </p>
                <p>
                  <span className="text-muted-foreground">Slots:</span> {slots} perfumes
                </p>
                <p>
                  <span className="text-muted-foreground">Pricing:</span>{' '}
                  {price ? `Fixed ₹${price}` : 'Sum of individual prices'}
                </p>
                {discount > 0 && (
                  <p>
                    <span className="text-muted-foreground">Discount:</span>{' '}
                    <span className="text-emerald-600">{discount}% off</span>
                  </p>
                )}
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end pt-4">
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="btn-luxury"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Settings
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminDiscoverySettings;
