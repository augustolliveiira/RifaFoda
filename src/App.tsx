import React, { useState, useEffect } from 'react';
import { Car, Trophy, Shield, Clock, Users, Star, Gift, Zap, CheckCircle, AlertTriangle, Copy, QrCode, X } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { gerarPix, verificarStatusPagamento } from './services/pixService';
import { PurchaseNotifications } from './components/PurchaseNotifications';

interface FormData {
  name: string;
  email: string;
  cpf: string;
  phone: string;
  quantity: number;
}

interface PixData {
  pixQrCode: string;
  pixCode: string;
  status: string;
  id: string;
}

const PRICE_PER_NUMBER = 0.50;
const TOTAL_NUMBERS = 100000;
const SOLD_NUMBERS = 73420;

function App() {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    cpf: '',
    phone: '',
    quantity: 100
  });
  
  const [pixData, setPixData] = useState<PixData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPixModal, setShowPixModal] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<string>('pending');
  const [copied, setCopied] = useState(false);

  // Debug UTMs no carregamento da página
  useEffect(() => {
    console.log('LEK DO BLACK: App carregado, verificando UTMs...');
    
    // Verificar UTMs na URL atual
    const urlParams = new URLSearchParams(window.location.search);
    const utmKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'click_id', 'fbclid', 'gclid', 'src', 'sck'];
    
    console.log('LEK DO BLACK: URL atual:', window.location.href);
    
    utmKeys.forEach(key => {
      const urlValue = urlParams.get(key);
      const storageValue = localStorage.getItem(key);
      
      if (urlValue) {
        console.log(`LEK DO BLACK: UTM na URL: ${key} = ${urlValue}`);
      }
      if (storageValue) {
        console.log(`LEK DO BLACK: UTM no storage: ${key} = ${storageValue}`);
      }
    });
  }, []);

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name === 'cpf') {
      setFormData(prev => ({ ...prev, [name]: formatCPF(value) }));
    } else if (name === 'phone') {
      setFormData(prev => ({ ...prev, [name]: formatPhone(value) }));
    } else if (name === 'quantity') {
      const quantity = Math.max(1, parseInt(value) || 1);
      setFormData(prev => ({ ...prev, [name]: quantity }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    console.log('LEK DO BLACK: Iniciando geração do PIX...');
    console.log('LEK DO BLACK: Dados do formulário:', formData);

    try {
      const totalAmount = Math.round(formData.quantity * PRICE_PER_NUMBER * 100);
      const itemName = `${formData.quantity} números da rifa - SW4 0KM + Moto BMW`;

      console.log('LEK DO BLACK: Valor total em centavos:', totalAmount);
      console.log('LEK DO BLACK: Nome do item:', itemName);

      const response = await gerarPix(
        formData.name,
        formData.email,
        formData.cpf.replace(/\D/g, ''),
        formData.phone.replace(/\D/g, ''),
        totalAmount,
        itemName
      );

      console.log('LEK DO BLACK: Resposta do PIX:', response);

      setPixData(response);
      setShowPixModal(true);
      
      // Iniciar verificação de status
      const statusInterval = setInterval(async () => {
        try {
          const status = await verificarStatusPagamento(response.id);
          setPaymentStatus(status);
          
          if (status === 'paid' || status === 'approved') {
            clearInterval(statusInterval);
            alert('Pagamento aprovado! Seus números foram reservados.');
          }
        } catch (error) {
          console.error('Erro ao verificar status:', error);
        }
      }, 5000);

      // Limpar interval após 10 minutos
      setTimeout(() => clearInterval(statusInterval), 600000);

    } catch (error) {
      console.error('LEK DO BLACK: Erro ao gerar PIX:', error);
      setError(error instanceof Error ? error.message : 'Erro desconhecido');
    } finally {
      setIsLoading(false);
    }
  };

  const copyPixCode = () => {
    if (pixData?.pixCode) {
      navigator.clipboard.writeText(pixData.pixCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const closeModal = () => {
    setShowPixModal(false);
    setPixData(null);
    setPaymentStatus('pending');
  };

  const remainingNumbers = TOTAL_NUMBERS - SOLD_NUMBERS;
  const percentageSold = (SOLD_NUMBERS / TOTAL_NUMBERS) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-green-900">
      <PurchaseNotifications />
      
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
        <div className="relative bg-gradient-to-r from-green-600 to-green-700 text-white py-6">
          <div className="max-w-md mx-auto px-4 text-center">
            <div className="flex items-center justify-center mb-3">
              <Trophy className="w-8 h-8 text-yellow-300 mr-2" />
              <h1 className="text-2xl font-black">SUPER RIFA</h1>
            </div>
            <p className="text-green-100 text-sm leading-relaxed">
              Concorra a uma <span className="font-bold text-yellow-300">SW4 0KM + Moto BMW</span> por apenas <span className="font-bold text-yellow-300">R$ 0,50</span> por número!
            </p>
          </div>
        </div>
      </div>

      {/* Urgency Alert */}
      <div className="bg-gradient-to-r from-red-500 to-red-600 text-white py-3">
        <div className="max-w-md mx-auto px-4">
          <div className="flex items-center justify-center space-x-2">
            <AlertTriangle className="w-5 h-5 animate-pulse" />
            <span className="font-bold text-sm">ÚLTIMAS {remainingNumbers.toLocaleString()} COTAS!</span>
            <AlertTriangle className="w-5 h-5 animate-pulse" />
          </div>
          <div className="mt-2 bg-white/20 rounded-full h-2">
            <div 
              className="bg-yellow-300 h-2 rounded-full transition-all duration-1000"
              style={{ width: `${percentageSold}%` }}
            ></div>
          </div>
          <p className="text-center text-xs mt-1 text-white/80">
            {percentageSold.toFixed(1)}% vendido - Restam apenas {remainingNumbers.toLocaleString()} números
          </p>
        </div>
      </div>

      {/* Prize Images */}
      <div className="py-6 bg-white/10">
        <div className="max-w-md mx-auto px-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="relative rounded-xl overflow-hidden shadow-xl">
              <img 
                src="/sw4-car.jpg" 
                alt="SW4 0KM" 
                className="w-full h-32 object-cover"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                <p className="text-white font-bold text-sm">SW4 0KM</p>
                <p className="text-yellow-300 text-xs">Valor: R$ 280.000</p>
              </div>
            </div>
            <div className="relative rounded-xl overflow-hidden shadow-xl">
              <img 
                src="/pexels-photo-170811.jpg" 
                alt="Moto BMW" 
                className="w-full h-32 object-cover"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                <p className="text-white font-bold text-sm">Moto BMW</p>
                <p className="text-yellow-300 text-xs">Valor: R$ 45.000</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Benefits */}
      <div className="py-6 bg-white/5">
        <div className="max-w-md mx-auto px-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/10 rounded-lg p-3 text-center">
              <Shield className="w-6 h-6 text-green-400 mx-auto mb-1" />
              <p className="text-white text-xs font-medium">100% Seguro</p>
              <p className="text-green-200 text-xs">Auditado LOTEP</p>
            </div>
            <div className="bg-white/10 rounded-lg p-3 text-center">
              <Clock className="w-6 h-6 text-blue-400 mx-auto mb-1" />
              <p className="text-white text-xs font-medium">Sorteio</p>
              <p className="text-blue-200 text-xs">15/02/2025</p>
            </div>
            <div className="bg-white/10 rounded-lg p-3 text-center">
              <Users className="w-6 h-6 text-yellow-400 mx-auto mb-1" />
              <p className="text-white text-xs font-medium">Participantes</p>
              <p className="text-yellow-200 text-xs">+15.000</p>
            </div>
            <div className="bg-white/10 rounded-lg p-3 text-center">
              <Star className="w-6 h-6 text-orange-400 mx-auto mb-1" />
              <p className="text-white text-xs font-medium">Avaliação</p>
              <p className="text-orange-200 text-xs">4.9/5 ⭐</p>
            </div>
          </div>
        </div>
      </div>

      {/* Purchase Form */}
      <div className="py-6">
        <div className="max-w-md mx-auto px-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6">
            <div className="text-center mb-6">
              <Gift className="w-12 h-12 text-green-600 mx-auto mb-3" />
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Garanta seus números!</h2>
              <p className="text-gray-600 text-sm">Preencha os dados e participe agora</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome completo
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:border-green-500 outline-none transition-colors"
                  placeholder="Seu nome completo"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  E-mail
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:border-green-500 outline-none transition-colors"
                  placeholder="seu@email.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  CPF
                </label>
                <input
                  type="text"
                  name="cpf"
                  value={formData.cpf}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:border-green-500 outline-none transition-colors"
                  placeholder="000.000.000-00"
                  maxLength={14}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Telefone
                </label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:border-green-500 outline-none transition-colors"
                  placeholder="(11) 99999-9999"
                  maxLength={15}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantidade de números
                </label>
                <div className="grid grid-cols-4 gap-2 mb-3">
                  {[100, 200, 500, 1000].map((qty) => (
                    <button
                      key={qty}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, quantity: qty }))}
                      className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                        formData.quantity === qty
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {qty}
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleInputChange}
                  min="1"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:border-green-500 outline-none transition-colors"
                  placeholder="Ou digite a quantidade"
                />
              </div>

              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-700 font-medium">Total a pagar:</span>
                  <span className="text-2xl font-bold text-green-600">
                    R$ {(formData.quantity * PRICE_PER_NUMBER).toFixed(2)}
                  </span>
                </div>
                <p className="text-sm text-gray-600">
                  {formData.quantity} números × R$ {PRICE_PER_NUMBER.toFixed(2)}
                </p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Gerando PIX...
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5 mr-2" />
                    GERAR PIX AGORA
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* PIX Modal */}
      {showPixModal && pixData && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-full overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-800">PIX Gerado!</h3>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="text-center mb-6">
                <div className="bg-white p-4 rounded-xl border-2 border-gray-200 inline-block">
                  <QRCodeSVG 
                    value={pixData.pixCode} 
                    size={200}
                    level="M"
                    includeMargin={true}
                  />
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  Escaneie o QR Code ou copie o código PIX
                </p>
              </div>

              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-3">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Código PIX:
                  </label>
                  <div className="flex">
                    <input
                      type="text"
                      value={pixData.pixCode}
                      readOnly
                      className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-l-lg text-sm font-mono"
                    />
                    <button
                      onClick={copyPixCode}
                      className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-r-lg transition-colors flex items-center"
                    >
                      {copied ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  {copied && (
                    <p className="text-green-600 text-xs mt-1">Código copiado!</p>
                  )}
                </div>

                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <div className="flex items-center mb-2">
                    <div className={`w-3 h-3 rounded-full mr-2 ${
                      paymentStatus === 'paid' || paymentStatus === 'approved' 
                        ? 'bg-green-500' 
                        : 'bg-yellow-500 animate-pulse'
                    }`}></div>
                    <span className="font-medium text-gray-800">
                      Status: {paymentStatus === 'pending' ? 'Aguardando pagamento' : 
                               paymentStatus === 'paid' || paymentStatus === 'approved' ? 'Pago' : 
                               paymentStatus}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Após o pagamento, seus números serão reservados automaticamente.
                  </p>
                </div>

                <div className="text-center">
                  <p className="text-xs text-gray-500">
                    PIX válido por 24 horas • ID: {pixData.id}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="bg-gray-800/50 text-white py-6 pb-24">
        <div className="max-w-md mx-auto px-4 text-center">
          <p className="text-sm text-gray-300 mb-2">
            Sorteio realizado pela LOTEP • Licença nº 12.345/2024
          </p>
          <p className="text-xs text-gray-400">
            Este sorteio é auditado e fiscalizado pelos órgãos competentes
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;