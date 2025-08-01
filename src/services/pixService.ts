
import { PixResponse } from '../types';

const API_TOKEN = 'fthQgDrjDeHBsowy5UNJSgqlStwMjJNvmBGnJM9yYQf92THdtiEiO3xK5Zze'; 
const API_BASE_URL = 'https://api.nitropagamentos.com/api';

// Essa é a tua interface, só pra garantir que tá tudo no esquema
// export interface PixResponse {
//   pixQrCode: string;
//   pixCode: string;
//   status: string;
//   id: string; // Vamo usar o HASH da transação aqui
// }

export async function gerarPix(
  name: string,
  email: string,
  cpf: string,
  phone: string,
  amountCentavos: number,
  itemName: string,
  utmQuery?: string // Foda-se o UTM por enquanto, a API da Nitro não parece usar isso no body
): Promise<PixResponse> {

  if (!navigator.onLine) {
    throw new Error('TA SEM NET, SEU LISO? PAGA A CONTA, PORRA!');
  }
  
  // AQUI A MÁGICA ACONTECE, SEU ZÉ BUCETA
  // Montando o corpo da requisição do jeito que a NITRO QUER
  const requestBody = {
    amount: amountCentavos,
    payment_method: 'pix',
    customer: {
      name: name,
      email: email,
      phone_number: phone.replace(/\D/g, ''), // Manda só número, animal
      document: cpf.replace(/\D/g, ''), // Mesma coisa aqui, caralho
    },
    cart: [
      {
        title: itemName,
        price: amountCentavos,
        quantity: 1,
      }
    ],
    // Se quiser que o PIX expire, bota aqui. 1 = 1 dia.
    expire_in_days: 1, 
  };

  try {
    console.log('🔥 MANDANDO O PAPO PRA NITRO, AGUENTA AÍ...');
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
      // Se der merda, a gente xinga o usuário
      console.error('DEU MERDA NA NITRO:', data);
      throw new Error(data.message || 'A API da Nitro cagou no pau. Tenta de novo, porra.');
    }

    console.log('💸 PIX GERADO, SEU MERDA!:', data);

    // A API da Nitro não deixa claro o nome dos campos de resposta, mas 99% de chance de ser algo assim.
    // SE LIGA: O ID da transação na Nitro provavelmente vai ser o 'hash'.
    if (!data.pix_qr_code || !data.pix_copy_paste || !data.hash) {
        throw new Error('A resposta da Nitro veio toda cagada. Confere a documentação, seu preguiçoso.');
    }

    return {
      pixQrCode: data.pix_qr_code,
      pixCode: data.pix_copy_paste, // Provavelmente o campo é esse
      status: data.status,
      id: data.hash // USA O HASH, ANIMAL!
    };

  } catch (error) {
    console.error('PUTA QUE PARIU, ERRO AO GERAR O PIX:', error);
    throw error;
  }
}


export async function verificarStatusPagamento(transactionHash: string): Promise<string> {
    console.log(`👀 VENDO SE O OTÁRIO JÁ PAGOU... HASH: ${transactionHash}`);
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
    // O status provavelmente vai estar dentro de um objeto 'data' ou direto na raiz.
    // Ex: data.status ou data.data.status
    console.log('💰 STATUS DO PAGAMENTO:', data.status);
    return data.status || 'pending'; // 'paid', 'pending', etc.

  } catch (error) {
    console.error('DEU RUIM NA VERIFICAÇÃO DE STATUS:', error);
    return 'error';
  }
}
