import { useState, useEffect } from 'react';
import { useLocation, useParams } from 'wouter';
import { ArrowRight, MapPin, Clock, Phone, User, Package, CheckCircle, Truck, Loader2, AlertCircle, Home, Building, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

export default function OrderTrackingPage() {
  const [, setLocation] = useLocation();
  const { id } = useParams();
  const { toast } = useToast();
  const { user } = useAuth();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setLocation('/track-orders');
      return;
    }

    const fetchOrder = async () => {
      try {
        setLoading(true);
        setError(null);

        // Try to fetch from regular orders first
        let res = await fetch(`/api/orders/${id}`);
        let data = await res.json();

        // If not found, try wasalni orders
        if (!res.ok) {
          const wasalniRes = await fetch(`/api/wasalni/${id}`);
          if (wasalniRes.ok) {
            const wasalniData = await wasalniRes.json();
            data = {
              ...wasalniData,
              orderNumber: wasalniData.requestNumber,
              restaurantName: 'طلب وصل لي',
              isSareeOneLi: true // تم التصحيح
            };
          } else {
            setError('الطلب غير موجود');
            toast({
              title: "خطأ",
              description: "لم يتم العثور على الطلب",
              variant: "destructive",
            });
            return;
          }
        }

        setOrder(data);
      } catch (err) {
        console.error(err);
        setError('حدث خطأ أثناء تحميل الطلب');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id, setLocation, toast]);

  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      pending: 'قيد المراجعة',
      confirmed: 'مؤكد',
      preparing: 'قيد التحضير',
      on_way: 'في الطريق',
      delivered: 'تم التوصيل',
      cancelled: 'ملغي'
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
      pending: 'bg-yellow-500',
      confirmed: 'bg-blue-500',
      preparing: 'bg-orange-500',
      on_way: 'bg-purple-500',
      delivered: 'bg-green-500',
      cancelled: 'bg-red-500'
    };
    return colorMap[status] || 'bg-gray-500';
  };

  const getStatusIcon = (status: string) => {
    const iconMap: Record<string, any> = {
      pending: Clock,
      confirmed: CheckCircle,
      preparing: Package,
      on_way: Truck,
      delivered: CheckCircle,
      cancelled: AlertCircle
    };
    return iconMap[status] || Clock;
  };

  const getAddressTypeIcon = (type: string) => {
    const iconMap: Record<string, any> = {
      home: Home,
      work: Building,
      other: MapPin
    };
    return iconMap[type] || MapPin;
  };

  const getStatusSteps = (status: string) => {
    const steps = [
      { key: 'pending', label: 'قيد المراجعة', icon: Clock },
      { key: 'confirmed', label: 'تم التأكيد', icon: CheckCircle },
      { key: 'preparing', label: 'قيد التحضير', icon: Package },
      { key: 'on_way', label: 'في الطريق', icon: Truck },
      { key: 'delivered', label: 'تم التوصيل', icon: CheckCircle }
    ];

    const currentIndex = steps.findIndex(s => s.key === status);
    return steps.map((step, index) => ({
      ...step,
      completed: index <= currentIndex,
      active: index === currentIndex
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
          <p className="text-sm font-bold text-gray-400">جاري تحميل الطلب...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center" dir="rtl">
        <div className="text-center max-w-sm px-4">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-lg font-black text-gray-800 mb-2">الطلب غير موجود</h2>
          <p className="text-sm text-gray-500 font-bold mb-6">{error || 'لم نتمكن من العثور على الطلب المطلوب'}</p>
          <Button onClick={() => setLocation('/track-orders')} className="rounded-2xl font-black">
            العودة لتتبع الطلبات
          </Button>
        </div>
      </div>
    );
  }

  const statusSteps = getStatusSteps(order.status);
  const StatusIcon = getStatusIcon(order.status);

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation('/track-orders')}
              className="rounded-full"
            >
              <ArrowRight className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-black text-gray-900">تتبع الطلب</h1>
              <p className="text-xs text-gray-500 font-bold uppercase tracking-tight">
                #{order.orderNumber || order.id}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto p-4 space-y-6">
        {/* Order Status Card */}
        <Card className="rounded-[2rem] border-none shadow-sm overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-2xl ${getStatusColor(order.status)}/10 flex items-center justify-center`}>
                  <StatusIcon className={`h-6 w-6 text-${getStatusColor(order.status).replace('bg-', '')}`} />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400">حالة الطلب</p>
                  <p className="text-sm font-black text-gray-900">{getStatusLabel(order.status)}</p>
                </div>
              </div>
              <Badge className={`${getStatusColor(order.status)} text-white border-none rounded-full text-[10px] font-black px-4 py-1`}>
                {getStatusLabel(order.status)}
              </Badge>
            </div>

            {/* Status Timeline */}
            <div className="relative mt-6">
              <div className="absolute right-4 top-0 bottom-0 w-0.5 bg-gray-100" />
              <div className="space-y-6">
                {statusSteps.map((step, index) => {
                  const StepIcon = step.icon;
                  return (
                    <div key={step.key} className="flex items-start gap-4 relative">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 shrink-0 ${
                        step.completed ? 'bg-primary text-white' : 'bg-gray-100 text-gray-300'
                      }`}>
                        <StepIcon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 pt-1">
                        <p className={`text-xs font-black ${
                          step.active ? 'text-primary' : step.completed ? 'text-gray-700' : 'text-gray-300'
                        }`}>
                          {step.label}
                        </p>
                        {step.active && order.updatedAt && (
                          <p className="text-[10px] text-gray-400 font-bold mt-0.5">
                            {format(new Date(order.updatedAt), 'hh:mm a', { locale: ar })}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Order Details */}
        <Card className="rounded-[2rem] border-none shadow-sm">
          <CardContent className="p-6 space-y-4">
            <h3 className="text-sm font-black text-gray-400">تفاصيل الطلب</h3>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-gray-500">رقم الطلب</span>
                <span className="text-xs font-black text-gray-900">#{order.orderNumber || order.id}</span>
              </div>
              
              <Separator className="bg-gray-50" />
              
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-gray-500">المطعم</span>
                <span className="text-xs font-black text-gray-900">{order.restaurantName || 'طلب متجر'}</span>
              </div>

              {order.isSareeOneLi && (
                <>
                  <Separator className="bg-gray-50" />
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-gray-500">نوع الطلب</span>
                    <span className="text-xs font-black text-primary">طلب وصل لي</span>
                  </div>
                </>
              )}

              {order.items && order.items.length > 0 && (
                <>
                  <Separator className="bg-gray-50" />
                  <div>
                    <p className="text-xs font-bold text-gray-500 mb-2">المنتجات</p>
                    <div className="space-y-1">
                      {order.items.map((item: any, index: number) => (
                        <div key={index} className="flex justify-between text-xs">
                          <span className="text-gray-700">{item.name || item.productName}</span>
                          <span className="font-black text-gray-900">{item.quantity} × {item.price} ريال</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              <Separator className="bg-gray-50" />
              
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-gray-500">المجموع</span>
                <span className="text-sm font-black text-primary">{order.total} ريال</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Address Section */}
        {order.address && (
          <Card className="rounded-[2rem] border-none shadow-sm">
            <CardContent className="p-6 space-y-4">
              <h3 className="text-sm font-black text-gray-400">عنوان التوصيل</h3>
              
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-orange-50 flex items-center justify-center shrink-0">
                    <MapPin className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black text-gray-900">{order.address.address || order.address.location}</p>
                    <p className="text-[10px] font-bold text-gray-400 mt-0.5">
                      {order.address.type === 'home' ? 'المنزل' : 
                       order.address.type === 'work' ? 'مكان العمل' : 'عنوان آخر'}
                    </p>
                  </div>
                </div>

                {order.address.notes && (
                  <div className="bg-gray-50 rounded-2xl p-3">
                    <p className="text-[10px] font-bold text-gray-500">ملاحظات: {order.address.notes}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Wasalni Pickup Info */}
        {order.isSareeOneLi && (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Navigation className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-black text-gray-700">طلب وصل لي</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">
                    هذا الطلب من خدمة وصل لي - سيتم إحضاره من المتجر
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Contact Actions */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            className="h-14 rounded-2xl border-none shadow-sm bg-white hover:bg-orange-50 transition-all group"
            onClick={() => window.open('tel:+967771234567')}
          >
            <Phone className="h-4 w-4 text-primary ml-2" />
            <span className="text-xs font-black text-gray-700">اتصال</span>
          </Button>
          
          <Button
            variant="outline"
            className="h-14 rounded-2xl border-none shadow-sm bg-white hover:bg-green-50 transition-all group"
            onClick={() => window.open('https://wa.me/967771234567')}
          >
            <User className="h-4 w-4 text-[#25D366] ml-2" />
            <span className="text-xs font-black text-gray-700">واتساب</span>
          </Button>
        </div>

        {/* Back Button */}
        <Button
          variant="ghost"
          className="w-full rounded-2xl text-gray-400 font-black text-xs hover:bg-gray-50"
          onClick={() => setLocation('/track-orders')}
        >
          العودة لتتبع الطلبات
        </Button>
      </div>
    </div>
  );
}
