import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { KuberkermisProdukt, getKuberkermisKategorieLabel, Gemeente } from '@/types/nhka';
import {
  ShoppingBag,
  Package,
  Image as ImageIcon,
  ShoppingCart,
  Plus,
  Minus,
  X,
  Church,
  Loader2,
  CreditCard,
  CheckCircle,
  AlertCircle,
  Info,
  Percent,
  Ticket
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

interface CartItem {
  produk: KuberkermisProdukt;
  hoeveelheid: number;
}

const LOGO_URL = 'https://d64gsuwffb70l.cloudfront.net/693a23272f683bba6f73274f_1766339692475_f44b3809.png';

// Helper function to safely format price values (handles both string and number)
const formatPrice = (price: number | string | null | undefined): string => {
  if (price === null || price === undefined) return '0.00';
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  if (isNaN(numPrice)) return '0.00';
  return numPrice.toFixed(2);
};

// Helper function to safely get numeric price value
const getNumericPrice = (price: number | string | null | undefined): number => {
  if (price === null || price === undefined) return 0;
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  if (isNaN(numPrice)) return 0;
  return numPrice;
};

const PublicKuberkermis: React.FC = () => {

  const { gemeenteId } = useParams<{ gemeenteId: string }>();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  const [gemeente, setGemeente] = useState<Gemeente | null>(null);
  const [produkte, setProdukte] = useState<KuberkermisProdukt[]>([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [allocatedTickets, setAllocatedTickets] = useState<{ produk: string, nommers: string[] }[]>([]);
  const [allocatedVouchers, setAllocatedVouchers] = useState<{ produk: string, kodes: string[] }[]>([]);
  const [allocating, setAllocating] = useState(false);

  // Checkout form
  const [checkoutForm, setCheckoutForm] = useState({
    naam: '',
    selfoon: '',
    epos: ''
  });

  // Check for specific product in URL
  const highlightedProductId = searchParams.get('produk');

  useEffect(() => {
    if (gemeenteId) {
      loadGemeenteAndProdukte();
    }
  }, [gemeenteId]);

  useEffect(() => {
    // Check for payment status in URL
    const paymentStatus = searchParams.get('payment');
    if (paymentStatus === 'success') {
      handlePaymentSuccess();
    }
  }, [searchParams]);

  const handlePaymentSuccess = async () => {
    setPaymentSuccess(true);
    setCart([]);
    localStorage.removeItem(`kuberkermis_cart_${gemeenteId}`);

    const pendingOrderIds = JSON.parse(localStorage.getItem(`kuberkermis_pending_orders_${gemeenteId}`) || '[]');
    if (pendingOrderIds.length > 0) {
      setAllocating(true);
      try {
        // 1. Mark orders as paid
        await supabase
          .from('kuberkermis_bestellings')
          .update({ betaal_status: 'betaal' })
          .in('id', pendingOrderIds);

        // 2. Fetch order details to see if any are tickets
        // Using a more robust select if the join fails
        const { data: orders, error: ordersError } = await supabase
          .from('kuberkermis_bestellings')
          .select('*, produk:kuberkermis_produkte(*)')
          .in('id', pendingOrderIds);

        if (ordersError) throw ordersError;

        if (orders) {
          console.log(`Processing ${orders.length} orders for tickets/stock`);
          const ticketsFound: { produk: string, nommers: string[] }[] = [];
          const vouchersFound: { produk: string, kodes: string[] }[] = [];

          const generateVoucherCode = (): string => {
            const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
            let code = '';
            const arr = new Uint8Array(8);
            crypto.getRandomValues(arr);
            for (let i = 0; i < 8; i++) code += chars[arr[i]! % chars.length];
            return code;
          };

          for (const order of orders) {
            // Ensure we have the product data (join might fail if RLS or relations are weird)
            let produk = order.produk;
            if (!produk) {
              const { data: pData } = await supabase
                .from('kuberkermis_produkte')
                .select('*')
                .eq('id', order.produk_id)
                .single();
              produk = pData;
            }

            if (!produk) {
              console.warn(`Could not find product for order ${order.id}`);
              continue;
            }

            // Update local stock for the product (if limited > 0)
            // Ensure we use the latest stock value from the database to avoid race conditions
            const { data: latestProduk } = await supabase
              .from('kuberkermis_produkte')
              .select('voorraad')
              .eq('id', order.produk_id)
              .single();

            const currentVoorraad = Number(latestProduk?.voorraad ?? produk.voorraad);
            if (!isNaN(currentVoorraad) && currentVoorraad >= 0 && currentVoorraad !== -1) {
              const nuweVoorraad = Math.max(0, currentVoorraad - Number(order.hoeveelheid));
              console.log(`Updating stock for ${produk.titel}: ${currentVoorraad} -> ${nuweVoorraad}`);
              await supabase
                .from('kuberkermis_produkte')
                .update({ voorraad: nuweVoorraad })
                .eq('id', order.produk_id);
            }

            if (produk.is_kaartjie) {
              console.log(`Kuberkermis: Requesting ${order.hoeveelheid} tickets for ${produk.titel}`);
              // Allocate next available numbers
              const { data: availableTickets, error: fetchErr } = await supabase
                .from('kuberkermis_kaartjie_nommers')
                .select('*')
                .eq('produk_id', order.produk_id)
                .eq('is_verkoop', false)
                .order('created_at', { ascending: true })
                .limit(order.hoeveelheid);

              if (fetchErr) {
                console.error('Kuberkermis: Error fetching available tickets:', fetchErr);
                continue;
              }

              if (availableTickets && availableTickets.length > 0) {
                const ticketIds = availableTickets.map(t => t.id);
                const ticketNommers = availableTickets.map(t => t.nommer);

                console.log(`Kuberkermis: Attempting to link tickets: ${ticketNommers.join(', ')} to order ${order.id}`);

                // Mark these as sold and link to this order
                const { data: updatedData, error: updateError } = await supabase
                  .from('kuberkermis_kaartjie_nommers')
                  .update({
                    is_verkoop: true,
                    bestelling_id: order.id
                  })
                  .in('id', ticketIds)
                  .select();

                if (updateError) {
                  console.error('Kuberkermis: Error updating ticket status:', updateError);
                } else {
                  console.log(`Kuberkermis: Successfully updated ${updatedData?.length} tickets in DB`);

                  // ONLY add to success UI if database update was successful
                  ticketsFound.push({
                    produk: produk.titel,
                    nommers: ticketNommers
                  });
                }
              } else {
                console.warn(`Kuberkermis: No available tickets found for product ${produk.id}`);
              }
            }

            // LMS course vouchers: generate one code per quantity
            const lmsKursusId = (produk as { lms_kursus_id?: string | null }).lms_kursus_id;
            if (lmsKursusId && order.hoeveelheid > 0) {
              const kodes: string[] = [];
              for (let i = 0; i < order.hoeveelheid; i++) {
                let code = generateVoucherCode();
                while (kodes.includes(code)) code = generateVoucherCode();
                kodes.push(code);
              }
              const { error: vErr } = await supabase
                .from('lms_kursus_vouchers')
                .insert(kodes.map(voucher_kode => ({
                  voucher_kode,
                  kursus_id: lmsKursusId,
                  bestelling_id: order.id
                })));
              if (vErr) {
                console.error('Kuberkermis: Error creating vouchers:', vErr);
              } else {
                vouchersFound.push({ produk: produk.titel || 'Kursus voucher', kodes });
              }
            }
          }
          console.log('Kuberkermis: Final tickets found for UI:', ticketsFound);
          setAllocatedTickets(ticketsFound);
          setAllocatedVouchers(vouchersFound);
        }
        localStorage.removeItem(`kuberkermis_pending_orders_${gemeenteId}`);
      } catch (err) {
        console.error('Error processing success allocation:', err);
      } finally {
        setAllocating(false);
      }
    }
  };

  // Load cart from localStorage
  useEffect(() => {
    const savedCart = localStorage.getItem(`kuberkermis_cart_${gemeenteId}`);
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (e) {
        console.error('Error loading cart:', e);
      }
    }
  }, [gemeenteId]);

  // Save cart to localStorage
  useEffect(() => {
    if (gemeenteId && cart.length > 0) {
      localStorage.setItem(`kuberkermis_cart_${gemeenteId}`, JSON.stringify(cart));
    }
  }, [cart, gemeenteId]);

  const loadGemeenteAndProdukte = async () => {
    try {
      // Load gemeente
      const { data: gemeenteData, error: gemeenteError } = await supabase
        .from('gemeentes')
        .select('*')
        .eq('id', gemeenteId)
        .single();

      if (gemeenteError) throw gemeenteError;
      setGemeente(gemeenteData);

      // Load active products
      const { data: produkteData, error: produkteError } = await supabase
        .from('kuberkermis_produkte')
        .select('*')
        .eq('gemeente_id', gemeenteId)
        .eq('aktief', true)
        .order('created_at', { ascending: false });

      if (produkteError) throw produkteError;
      setProdukte(produkteData || []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: 'Fout',
        description: 'Kon nie data laai nie',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (produk: KuberkermisProdukt) => {
    setCart(prev => {
      const existing = prev.find(item => item.produk.id === produk.id);
      if (existing) {
        return prev.map(item =>
          item.produk.id === produk.id
            ? { ...item, hoeveelheid: item.hoeveelheid + 1 }
            : item
        );
      }
      return [...prev, { produk, hoeveelheid: 1 }];
    });
    toast({
      title: 'Bygevoeg!',
      description: `${produk.titel} is by jou mandjie gevoeg`
    });
  };

  const updateQuantity = (produktId: string, delta: number) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.produk.id === produktId) {
          const newQty = item.hoeveelheid + delta;
          if (newQty <= 0) return null;
          return { ...item, hoeveelheid: newQty };
        }
        return item;
      }).filter(Boolean) as CartItem[];
    });
  };

  const removeFromCart = (produktId: string) => {
    setCart(prev => prev.filter(item => item.produk.id !== produktId));
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + (getNumericPrice(item.produk.prys) * item.hoeveelheid), 0);
  };


  const getCartCount = () => {
    return cart.reduce((count, item) => count + item.hoeveelheid, 0);
  };

  const handleCheckout = async () => {
    if (!checkoutForm.naam || !checkoutForm.selfoon) {
      toast({
        title: 'Fout',
        description: 'Naam en selfoon is verpligtend',
        variant: 'destructive'
      });
      return;
    }

    setProcessingPayment(true);

    try {
      // Create orders for each cart item
      const orders = cart.map(item => ({
        gemeente_id: gemeenteId,
        produk_id: item.produk.id,
        koper_naam: checkoutForm.naam,
        koper_selfoon: checkoutForm.selfoon,
        koper_epos: checkoutForm.epos || null,
        hoeveelheid: item.hoeveelheid,
        totaal_bedrag: getNumericPrice(item.produk.prys) * item.hoeveelheid,
        betaal_status: 'hangende'
      }));


      const { data: createdOrders, error: orderError } = await supabase
        .from('kuberkermis_bestellings')
        .insert(orders)
        .select();

      if (orderError) throw orderError;

      // Store order IDs for success page ticket allocation
      if (createdOrders) {
        localStorage.setItem(`kuberkermis_pending_orders_${gemeenteId}`, JSON.stringify(createdOrders.map(o => o.id)));
      }

      // Create Yoco checkout
      // Amount must be in cents
      const amountInCents = Math.round(getCartTotal() * 100);

      const response = await fetch('/yoco-proxy.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: amountInCents,
          description: `Kuberkermis - ${gemeente?.naam || 'Gemeente'}`,
          successUrl: `${window.location.origin}/kermis/${gemeenteId}?payment=success`,
          cancelUrl: `${window.location.origin}/kermis/${gemeenteId}?payment=cancelled`,
          metadata: {
            type: 'kuberkermis',
            gemeente_id: gemeenteId,
            koper_naam: checkoutForm.naam,
            koper_selfoon: checkoutForm.selfoon
          }
        })
      });

      let checkoutData;
      try {
        checkoutData = await response.json();
      } catch (e) {
        throw new Error('Ongeldige reaksie van betalingsbediener');
      }

      if (!response.ok) {
        throw new Error(checkoutData?.error || 'Kon nie betaling skep nie');
      }

      const checkoutError = null;

      if (checkoutError) throw checkoutError;

      if (checkoutData?.redirectUrl) {
        window.location.href = checkoutData.redirectUrl;
      } else {
        throw new Error('Geen betaling skakel ontvang nie');
      }
    } catch (error: any) {
      console.error('Checkout error:', error);

      // Try to extract detailed error message
      let errorMsg = 'Kon nie betaling verwerk nie. ';
      if (error?.message) {
        // If it's a JSON string, try to parse it
        try {
          const body = JSON.parse(error.message);
          if (body.error) errorMsg += body.error;
          else errorMsg += error.message;
        } catch (e) {
          errorMsg += error.message;
        }
      }

      toast({
        title: 'Fout met Betaling',
        description: errorMsg,
        variant: 'destructive'
      });
      setProcessingPayment(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#002855] to-[#003d7a] flex items-center justify-center">
        <div className="text-center">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-white p-2 shadow-2xl">
            <img
              src={LOGO_URL}
              alt="Logo"
              className="w-full h-full rounded-full object-contain"
            />
          </div>
          <Loader2 className="w-12 h-12 text-[#D4A84B] animate-spin mx-auto mb-4" />
          <p className="text-white text-lg">Laai kuberkermis...</p>
        </div>
      </div>
    );
  }

  if (!gemeente) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-16 h-16 mx-auto text-red-500 mb-4" />
            <h1 className="text-xl font-bold text-gray-900 mb-2">Gemeente nie gevind nie</h1>
            <p className="text-gray-600">
              Hierdie kuberkermis skakel is ongeldig of die gemeente bestaan nie meer nie.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (paymentSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Dankie vir jou aankoop!</h1>
            <p className="text-gray-600 mb-6">
              Jou betaling is suksesvol verwerk. Die gemeente sal binnekort met jou in verbinding tree.
            </p>

            {allocating && (
              <div className="flex flex-col items-center justify-center p-6 bg-gray-50 rounded-lg mb-6">
                <Loader2 className="w-8 h-8 animate-spin text-[#002855] mb-2" />
                <p className="text-sm text-gray-600 font-medium">Besig om jou kaartjie nommers toe te ken...</p>
                <p className="text-xs text-gray-400 mt-1">Moenie die bladsy toemaak nie.</p>
              </div>
            )}

            {!allocating && allocatedTickets.length > 0 && (
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-6 text-left">
                <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                  <Ticket className="w-5 h-5 text-[#D4A84B]" /> Jou Kaartjie Nommers:
                </h3>
                <div className="space-y-3">
                  {allocatedTickets.map((t, idx) => (
                    <div key={idx}>
                      <p className="text-xs font-semibold uppercase tracking-wider text-blue-600 mb-1">{t.produk}:</p>
                      <div className="flex flex-wrap gap-2">
                        {t.nommers.map(n => (
                          <Badge key={n} variant="secondary" className="bg-white border-blue-200 text-[#002855] font-mono text-sm px-3 py-1">
                            {n}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-3 border-t border-blue-100">
                  <p className="text-xs text-blue-600 italic">
                    * Neem asseblief 'n skermskoot van hierdie nommers vir jou rekords of wys dit by die kermis.
                  </p>
                </div>
              </div>
            )}

            {!allocating && allocatedVouchers.length > 0 && (
              <div className="bg-amber-50 border border-amber-100 rounded-lg p-4 mb-6 text-left">
                <h3 className="font-semibold text-amber-900 mb-2 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-[#D4A84B]" /> Kursus Voucher Kodes:
                </h3>
                <div className="space-y-3">
                  {allocatedVouchers.map((v, idx) => (
                    <div key={idx}>
                      <p className="text-xs font-semibold uppercase tracking-wider text-amber-700 mb-1">{v.produk}:</p>
                      <div className="flex flex-wrap gap-2">
                        {v.kodes.map(k => (
                          <Badge key={k} variant="secondary" className="bg-white border-amber-200 text-[#002855] font-mono text-sm px-3 py-1">
                            {k}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-3 border-t border-amber-100">
                  <p className="text-xs text-amber-700 italic">
                    * Gee hierdie kode aan die persoon wat vir die kursus wil registreer. Hulle voer dit in by Geloofsgroei Akademie → Registreer → Betaal met voucher.
                  </p>
                </div>
              </div>
            )}
            <Button
              onClick={() => setPaymentSuccess(false)}
              className="bg-[#002855] hover:bg-[#001d40]"
            >
              Terug na Kuberkermis
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-[#002855] text-white py-4 px-4 sticky top-0 z-40 shadow-lg">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            {gemeente.logo_url ? (
              <img
                src={gemeente.logo_url}
                alt={gemeente.naam}
                className="w-10 h-10 rounded-full object-cover bg-white"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                <Church className="w-6 h-6 text-[#D4A84B]" />
              </div>
            )}
            <div>
              <h1 className="font-bold text-lg">{gemeente.naam}</h1>
              <p className="text-xs text-white/70">Kuberkermis</p>
            </div>
          </div>

          <Button
            variant="outline"
            onClick={() => setShowCart(true)}
            className="relative bg-white/10 border-white/20 text-white hover:bg-white/20"
          >
            <ShoppingCart className="w-5 h-5" />
            {getCartCount() > 0 && (
              <span className="absolute -top-2 -right-2 w-5 h-5 bg-[#D4A84B] text-[#002855] text-xs font-bold rounded-full flex items-center justify-center">
                {getCartCount()}
              </span>
            )}
          </Button>
        </div>
      </header>

      {/* Hero */}
      <div className="bg-gradient-to-r from-[#002855] to-[#003d7a] text-white py-12 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <ShoppingBag className="w-16 h-16 mx-auto mb-4 text-[#D4A84B]" />
          <h2 className="text-3xl font-bold mb-2">Welkom by ons Kuberkermis!</h2>
          <p className="text-white/80 max-w-xl mx-auto">
            Ondersteun {gemeente.naam} deur produkte en dienste aanlyn te koop.
            Alle opbrengs gaan na die gemeente se projekte.
          </p>
        </div>
      </div>



      {/* Products */}
      <div className="max-w-6xl mx-auto p-4 md:p-6">
        {produkte.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Package className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Geen produkte beskikbaar nie</h3>
              <p className="text-gray-600">
                Hierdie gemeente het nog nie produkte op hulle kuberkermis gelaai nie.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {produkte.map(produk => (
              <Card
                key={produk.id}
                className={`overflow-hidden hover:shadow-lg transition-all ${highlightedProductId === produk.id ? 'ring-2 ring-[#D4A84B] shadow-lg' : ''
                  }`}
              >
                {produk.foto_url ? (
                  <div className="h-48 bg-gray-100">
                    <img
                      src={produk.foto_url}
                      alt={produk.titel}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="h-48 bg-gradient-to-br from-[#002855]/10 to-[#D4A84B]/10 flex items-center justify-center">
                    <ImageIcon className="w-16 h-16 text-gray-400" />
                  </div>
                )}
                <CardContent className="p-4">
                  <div className="mb-2">
                    <h3 className="font-semibold text-[#002855] text-lg">{produk.titel}</h3>
                    <Badge variant="outline" className="text-xs mt-1">
                      {getKuberkermisKategorieLabel(produk.kategorie)}
                    </Badge>
                  </div>
                  {produk.beskrywing && (
                    <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                      {produk.beskrywing}
                    </p>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-bold text-[#D4A84B]">
                      R{formatPrice(produk.prys)}
                    </span>
                    <Button
                      size="sm"
                      onClick={() => addToCart(produk)}
                      className="bg-[#002855] hover:bg-[#001d40]"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Voeg By
                    </Button>
                  </div>

                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 py-6 mt-12">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full overflow-hidden">
              <img
                src={LOGO_URL}
                alt="Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <span className="font-semibold text-[#002855]">Dra Mekaar se Laste</span>
          </div>
          <p className="text-sm text-gray-500">
            Aangedryf deur die NHKA Kuberkermis Platform
          </p>
        </div>
      </footer>

      {/* Cart Drawer */}
      <Dialog open={showCart} onOpenChange={setShowCart}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-[#D4A84B]" />
              Jou Mandjie
            </DialogTitle>
          </DialogHeader>

          {cart.length === 0 ? (
            <div className="py-8 text-center">
              <ShoppingCart className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">Jou mandjie is leeg</p>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {cart.map(item => (
                  <div key={item.produk.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    {item.produk.foto_url ? (
                      <img
                        src={item.produk.foto_url}
                        alt={item.produk.titel}
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-lg bg-gray-200 flex items-center justify-center">
                        <Package className="w-6 h-6 text-gray-400" />
                      </div>
                    )}
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{item.produk.titel}</h4>
                      <p className="text-[#D4A84B] font-semibold">
                        R{formatPrice(getNumericPrice(item.produk.prys) * item.hoeveelheid)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateQuantity(item.produk.id, -1)}
                        className="h-8 w-8 p-0"
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                      <span className="w-8 text-center font-medium">{item.hoeveelheid}</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateQuantity(item.produk.id, 1)}
                        className="h-8 w-8 p-0"
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeFromCart(item.produk.id)}
                        className="h-8 w-8 p-0 text-red-500 hover:text-red-600"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>


              <div className="border-t pt-4 mt-4">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-lg font-semibold">Totaal:</span>
                  <span className="text-2xl font-bold text-[#D4A84B]">
                    R{getCartTotal().toFixed(2)}
                  </span>
                </div>
                <Button
                  className="w-full bg-[#D4A84B] hover:bg-[#c49a3f] text-[#002855]"
                  onClick={() => { setShowCart(false); setShowCheckout(true); }}
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  Gaan Voort na Betaling
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Checkout Dialog */}
      <Dialog open={showCheckout} onOpenChange={setShowCheckout}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-[#D4A84B]" />
              Betaling
            </DialogTitle>
            <DialogDescription>
              Vul jou besonderhede in om die aankoop te voltooi
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="naam">Naam *</Label>
              <Input
                id="naam"
                value={checkoutForm.naam}
                onChange={(e) => setCheckoutForm({ ...checkoutForm, naam: e.target.value })}
                placeholder="Jou volle naam"
              />
            </div>

            <div>
              <Label htmlFor="selfoon">Selfoon Nommer *</Label>
              <Input
                id="selfoon"
                value={checkoutForm.selfoon}
                onChange={(e) => setCheckoutForm({ ...checkoutForm, selfoon: e.target.value })}
                placeholder="bv. 082 123 4567"
              />
            </div>

            <div>
              <Label htmlFor="epos">E-pos (opsioneel)</Label>
              <Input
                id="epos"
                type="email"
                value={checkoutForm.epos}
                onChange={(e) => setCheckoutForm({ ...checkoutForm, epos: e.target.value })}
                placeholder="jou@epos.com"
              />
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-medium">Totaal te betaal:</span>
                <span className="text-xl font-bold text-[#D4A84B]">
                  R{getCartTotal().toFixed(2)}
                </span>
              </div>
            </div>


          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCheckout(false)}>
              Terug
            </Button>
            <Button
              onClick={handleCheckout}
              disabled={processingPayment}
              className="bg-[#D4A84B] hover:bg-[#c49a3f] text-[#002855]"
            >
              {processingPayment ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Verwerk...
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4 mr-2" />
                  Betaal Nou
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PublicKuberkermis;
