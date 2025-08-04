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

  console.log('LEK DO BLACK: Iniciando coleta de UTMs para o checkout...');
  
  // Primeiro, vamos ver o que tem no localStorage
  console.log('LEK DO BLACK: Conteúdo do localStorage:');
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('utm_')) {
      console.log(`${key} = ${localStorage.getItem(key)}`);
    }
  }

  // Coleta UTMs do localStorage (com prefixo utm_)
  const utmData: any = {};
  const utmKeys = [
    'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 
    'click_id', 'fbclid', 'gclid', 'src', 'sck', 'gad_source', 'utm_id',
    'ttclid', 'msclkid', 'twclid', 'li_fat_id'
  ];
  
  utmKeys.forEach(key => {
    const value = localStorage.getItem(`utm_${key}`);
    if (value) {
      utmData[key] = value;
      console.log(`LEK DO BLACK: Enviando ${key} = ${value}`);
    }
  });
  
  // Também tenta pegar da URL atual (caso ainda esteja lá)
  const currentUrl = new URLSearchParams(window.location.search);
  utmKeys.forEach(key => {
    const value = currentUrl.get(key);
    if (value && !utmData[key]) {
      utmData[key] = value;
      console.log(`LEK DO BLACK: Pegou da URL atual ${key} = ${value}`);
    }
  });
  
  // Se tem utmQuery, também processa ela
  if (utmQuery) {
    const queryParams = new URLSearchParams(utmQuery);
    utmKeys.forEach(key => {
      const value = queryParams.get(key);
      if (value && !utmData[key]) {
        utmData[key] = value;
        console.log(`LEK DO BLACK: Pegou do utmQuery ${key} = ${value}`);
      }
    });
  }

  console.log('LEK DO BLACK: UTMs finais que vão pro checkout:', JSON.stringify(utmData, null, 2));
  
  // Se não tem nenhuma UTM, avisa
  if (Object.keys(utmData).length === 0) {
    console.warn('LEK DO BLACK: ATENÇÃO! Nenhuma UTM foi encontrada para enviar!');
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
    // Manda todas as UTMs que encontrou
    ...utmData,
    // URL para receber atualizações de status (opcional)
    postback_url: null
  };

  try {
    console.log('LEK DO BLACK: Payload completo para Nitro:', JSON.stringify(requestBody, null, 2));
    console.log('LEK DO BLACK: UTMs no payload:', Object.keys(utmData).length > 0 ? utmData : 'NENHUMA UTM ENCONTRADA!');

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