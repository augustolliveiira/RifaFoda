// ARQUIVO: src/services/pixService.ts - VERSÃO CORRIGIDA APÓS ANÁLISE DA DOCUMENTAÇÃO
import { PixResponse } from '../types';

const API_TOKEN = 'fthQgDrjDeHBsowy5UNJSgqlStwMjJNvmBGnJM9yYQf92THdtiEiO3xK5Zze'; 
const API_BASE_URL = 'https://api.nitropagamentos.com/api';

const PRODUCT_HASH = 'aa3chv0jvb';
const OFFER_HASH_BASE = 'ivuruf'; 

export interface PixResponse {
  pixQrCode: string;
  pixCode: string;
  status: string;
  id: string; 
}

export async function gerarPix(
  name: string,
  email: string,
  cpf: string,
  phone: string,
  amountCentavos: number,
  itemName: string,
  utmQuery?: string
): Promise<PixResponse> {

  if (!navigator.onLine) {
    throw new Error('Sem conexão com a internet.');
  }

  // Vamo catar o click_id que o porteiro guardou pra gente
  const clickId = localStorage.getItem('utm_click_id');

  const requestBody = {
    offer_hash: OFFER_HASH_BASE,
    amount: amountCentavos,
    payment_method: 'pix',
    customer: {
      name: name,
      email: email,
      phone_number: phone.replace(/\D/g, ''),
      document: cpf.replace(/\D/g, ''),
      // Campos de endereço são opcionais para PIX, mas vamos incluir valores padrão
      street_name: 'Não informado',
      number: 'sn',
      complement: '',
      neighborhood: 'Centro',
      city: 'Não informado',
      state: 'SP',
      zip_code: '00000000'
    },
    cart: [
      {
        product_hash: PRODUCT_HASH, 
        title: itemName,
        cover: null,
        price: amountCentavos,
        quantity: 1,
        operation_type: 1, 
        tangible: false
      }
    ],
    expire_in_days: 1,
    installments: 1,
    // Se o click_id existir, a gente manda ele junto. Se não, foda-se.
    ...(clickId && { click_id: clickId }),
    // URL para receber atualizações de status (opcional)
    postback_url: null
  };

  try {
    console.log('Enviando para Nitro (com click_id):', JSON.stringify(requestBody, null, 2));

    const response = await fetch(`${API_BASE_URL}/public/v1/transactions?api_token=${API_TOKEN}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('DEU MERDA NA NITRO:', data);
      throw new Error(data.message || 'A API da Nitro falhou.');
    }

    console.log('PIX Gerado:', data);
    
    // Verificar se a resposta contém os dados necessários do PIX
    if (!data.pix?.pix_qr_code || !data.hash) {
        throw new Error('A resposta da Nitro veio incompleta.');
    }

    return {
      pixQrCode: data.pix.pix_qr_code,
      pixCode: data.pix.pix_qr_code, // O QR code serve tanto para exibir quanto para copiar
      status: data.payment_status || 'pending',
      id: data.hash
    };

  } catch (error) {
    console.error('Erro ao gerar o PIX:', error);
    throw error;
  }
}

export async function verificarStatusPagamento(transactionHash: string): Promise<string> {
  try {
    const response = await fetch(`${API_BASE_URL}/public/v1/transactions/${transactionHash}?api_token=${API_TOKEN}`, {
      method: 'GET',
      headers: { 
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Erro ao checar o status: ${response.status}`);
    }

    const data = await response.json();
    
    console.log('Status do pagamento:', data.payment_status);
    return data.payment_status || 'pending';

  } catch (error) {
    console.error('Erro na verificação de status:', error);
    return 'error';
  }
}