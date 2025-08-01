
import { PixResponse } from '../types';

const API_TOKEN = 'fthQgDrjDeHBsowy5UNJSgqlStwMjJNvmBGnJM9yYQf92THdtiEiO3xK5Zze'; 
const API_BASE_URL = 'https://api.nitropagamentos.com/api';

const PRODUCT_HASH = 'aa3chv0jvb';
const OFFER_HASH_BASE = 'ivuruf'; 

// MUDA ESSA URL PRA URL DO SEU SISTEMA QUE RECEBE POSTBACK!
// SE VOCÊ NÃO TEM, USA UM SERVIÇO TIPO PIPEDREAM PRA TESTAR
const SEU_POSTBACK_URL_BASE = "https://SEU_SISTEMA.com/postback";

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

  // --- ALTERAÇÃO AQUI, SEU MERDA! ---
  let finalPostbackUrl = SEU_POSTBACK_URL_BASE;
  if (utmQuery) {
    // Se a URL base já tiver um '?', a gente usa '&'. Senão, a gente usa '?'
    const separator = finalPostbackUrl.includes('?') ? '&' : '?';
    finalPostbackUrl = `${finalPostbackUrl}${separator}${utmQuery}`;
  }
  // --- FIM DA ALTERAÇÃO ---

  const requestBody = {
    offer_hash: OFFER_HASH_BASE,
    amount: amountCentavos,
    payment_method: 'pix',
    customer: {
      name: name,
      email: email,
      phone_number: phone.replace(/\D/g, ''),
      document: cpf.replace(/\D/g, ''),
    },
    cart: [
      {
        product_hash: PRODUCT_HASH, 
        title: itemName,
        price: amountCentavos,
        quantity: 1,
        operation_type: 1, 
      }
    ],
    expire_in_days: 1,
    installments: 1,
    // ADICIONANDO A PORRA DO POSTBACK COM AS UTMS
    postback_url: finalPostbackUrl,
  };

  try {
    console.log('Enviando para Nitro:', JSON.stringify(requestBody, null, 2));

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
    
    if (!data.pix?.pix_qr_code || !data.hash) {
        throw new Error('A resposta da Nitro veio incompleta.');
    }

    return {
      pixQrCode: data.pix.pix_qr_code,
      pixCode: data.pix.pix_qr_code,
      status: data.payment_status,
      id: data.hash
    };

  } catch (error) {
    console.error('Erro ao gerar o PIX:', error);
    throw error;
  }
}

export async function verificarStatusPagamento(transactionHash: string): Promise<string> {
  // ... essa função continua a mesma merda
  try {
    const response = await fetch(`${API_BASE_URL}/public/v1/transactions/${transactionHash}?api_token=${API_TOKEN}`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
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
