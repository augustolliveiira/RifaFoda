
import { PixResponse } from '../types';

// BOTA A PORRA DO TEU TOKEN AQUI, JÁ FALEI
const API_TOKEN = 'fthQgDrjDeHBsowy5UNJSgqlStwMjJNvmBGnJM9yYQf92THdtiEiO3xK5Zze'; 
const API_BASE_URL = 'https://api.nitropagamentos.com/api';

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
    throw new Error('SEM INTERNET, ZÉ Ruela?');
  }
  
  // PRESTA ATENÇÃO, CARALHO! ISSO AQUI É O "body" DO TEU JSON
  const requestBody = {
    // Isso é o "amount" do JSON
    amount: amountCentavos,
    // Isso é o "payment_method" do JSON
    payment_method: 'pix',
    // Isso é o "customer" do JSON
    customer: {
      name: name,
      email: email,
      phone_number: phone.replace(/\D/g, ''),
      document: cpf.replace(/\D/g, ''),
    },
    // E AQUI, SEU ANIMAL, ESTÁ O "cart" DO JSON!
    // A gente monta ele na hora com os dados do pacote que o cliente escolheu!
    cart: [
      {
        title: itemName,
        price: amountCentavos,
        quantity: 1,
      }
    ],
    // "expire_in_days", igualzinho no JSON
    expire_in_days: 1, 
  };

  // O resto é a mesma merda que eu já te expliquei
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
    throw new Error(data.message || 'A Nitro cagou no pau de novo.');
  }

  // Confere a resposta pra pegar os nomes certos, PREGUIÇOSO!
  // Provavelmente vai ser data.pix_qr_code, data.pix_copy_paste e data.hash
  return {
    pixQrCode: data.pix_qr_code,
    pixCode: data.pix_copy_paste,
    status: data.status,
    id: data.hash 
  };
}

// ...o resto da função verificarStatusPagamento continua igual
export async function verificarStatusPagamento(transactionHash: string): Promise<string> {
    const response = await fetch(`${API_BASE_URL}/public/v1/transactions/${transactionHash}?api_token=${API_TOKEN}`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });
    if (!response.ok) throw new Error(`Erro ao checar status`);
    const data = await response.json();
    return data.status || 'pending';
}
