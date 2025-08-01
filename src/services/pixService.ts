// pixService.ts - A VERSÃO FINAL DE VERDADE, FODA-SE
import { PixResponse } from '../types';

const API_TOKEN = 'fthQgDrjDeHBsowy5UNJSgqlStwMjJNvmBGnJM9yYQf92THdtiEiO3xK5Zze'; 
const API_BASE_URL = 'https://api.nitropagamentos.com/api';

// O HASH DO PRODUTO QUE VOCÊ JÁ TINHA
const PRODUCT_HASH = 'aa3chv0jvb'; // <<< DEIXA ESSE AQUI

// AGORA A NOVIDADE, SEU ARROMBADO! COLA O HASH DA OFERTA AQUI
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
    // A GENTE VAI MANDAR O HASH DA OFERTA AQUI EM CIMA!
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
      }
    ],
    expire_in_days: 1, 
  };

  try {
    console.log('🔥 ÚLTIMA TENTATIVA, MANDANDO ISSO PRA NITRO:', JSON.stringify(requestBody, null, 2));

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
      throw new Error(data.message || 'A API da Nitro cagou no pau. Tenta de novo.');
    }

    console.log('💸 PIX GERADO, PORRA!:', data);
    
    if (!data.pix_qr_code || !data.pix_copy_paste || !data.hash) {
        throw new Error('A resposta da Nitro veio toda cagada.');
    }

    return {
      pixQrCode: data.pix_qr_code,
      pixCode: data.pix_copy_paste,
      status: data.status,
      id: data.hash 
    };

  } catch (error) {
    console.error('PUTA QUE PARIU, ERRO AO GERAR O PIX:', error);
    throw error;
  }
}

// A função de verificar status continua a mesma merda
export async function verificarStatusPagamento(transactionHash: string): Promise<string> {
    console.log(`👀 VENDO SE O OTÁRIO JÁ PAGOU... HASH: ${transactionHash}`);
    try {
      const response = await fetch(`${API_BASE_URL}/public/v1/transactions/${transactionHash}?api_token=${API_TOKEN}`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });
      if (!response.ok) throw new Error(`Erro ao checar o status: ${response.status}`);
      const data = await response.json();
      console.log('💰 STATUS DO PAGAMENTO:', data.status);
      return data.status || 'pending';
    } catch (error) {
      console.error('DEU RUIM NA VERIFICAÇÃO DE STATUS:', error);
      return 'error';
    }
}
