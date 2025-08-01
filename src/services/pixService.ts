// ARQUIVO: src/services/pixService.ts - VERSÃO CORRIGIDA PARA UTMs
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

  // Capturar UTMs do localStorage E da URL atual
  const utmData: any = {};
  
  // Primeiro, pegar da URL atual
  const urlParams = new URLSearchParams(window.location.search);
  const utmKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'click_id', 'fbclid', 'gclid', 'src', 'sck'];
  
  console.log('LEK DO BLACK: Capturando UTMs da URL atual...');
  utmKeys.forEach(key => {
    const urlValue = urlParams.get(key);
    if (urlValue) {
      utmData[key] = urlValue;
      console.log(`LEK DO BLACK: UTM da URL: ${key} = ${urlValue}`);
    }
  });

  // Depois, pegar do localStorage (pode sobrescrever se existir)
  console.log('LEK DO BLACK: Capturando UTMs do localStorage...');
  utmKeys.forEach(key => {
    const storageValue = localStorage.getItem(key);
    if (storageValue) {
      utmData[key] = storageValue;
      console.log(`LEK DO BLACK: UTM do storage: ${key} = ${storageValue}`);
    }
  });

  // Log de todas as UTMs que serão enviadas
  console.log('LEK DO BLACK: UTMs que serão enviadas para o gateway:', utmData);

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
    // Enviando todas as UTMs capturadas
    ...utmData
  };

  try {
    console.log('LEK DO BLACK: Payload completo sendo enviado para Nitro:');
    console.log(JSON.stringify(requestBody, null, 2));

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
      console.error('LEK DO BLACK: ERRO NA RESPOSTA DA NITRO:', {
        status: response.status,
        statusText: response.statusText,
        data: data
      });
      throw new Error(data.message || 'A API da Nitro falhou.');
    }

    console.log('LEK DO BLACK: PIX Gerado com sucesso! Resposta da Nitro:', data);
    
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
    console.error('LEK DO BLACK: Erro ao gerar o PIX:', error);
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
    
    console.log('Status do pagamento:', data.payment_status);
    return data.payment_status || 'pending';

  } catch (error) {
    console.error('Erro na verificação de status:', error);
    return 'error';
  }
}