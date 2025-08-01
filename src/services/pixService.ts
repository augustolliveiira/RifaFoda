
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
    throw new Error('TA SEM NET, SEU LISO?');
  }

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
  };

  try {
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
      throw new Error(data.message || 'A API da Nitro cagou no pau.');
    }

    console.log('💸 PIX GERADO, PORRA!:', data);
    
    // --- ALTERAÇÃO FINAL AQUI, SEU MERDA ---
    // Usando os nomes certos que a gente viu no print
    if (!data.pix?.pix_qr_code || !data.hash) {
        throw new Error('A resposta da Nitro veio sem QR Code ou Hash.');
    }

    return {
      pixQrCode: data.pix.pix_qr_code,
      pixCode: data.pix.pix_qr_code, // O QR Code é o próprio Copia e Cola
      status: data.payment_status,    // O campo certo é 'payment_status'
      id: data.hash                   // O campo certo é 'hash'
    };
    // --- FIM DA ALTERAÇÃO ---

  } catch (error) {
    console.error('PUTA QUE PARIU, ERRO AO GERAR O PIX:', error);
    throw error;
  }
}

export async function verificarStatusPagamento(transactionHash: string): Promise<string> {
  try {
    const response = await fetch(`${API_BASE_URL}/public/v1/transactions/${transactionHash}?api_token=${API_TOKEN}`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });

    if (!response.ok) {
      throw new Error(`Erro ao checar o status: ${response.status}`);
    }

    const data = await response.json();
    
    // CORRIGIDO AQUI TAMBÉM, ANIMAL
    console.log('💰 STATUS DO PAGAMENTO:', data.payment_status);
    return data.payment_status || 'pending';

  } catch (error) {
    console.error('DEU RUIM NA VERIFICAÇÃO DE STATUS:', error);
    return 'error';
  }
}
