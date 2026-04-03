import { unmaskDigits } from "@/lib/masks";

type ViaCepResponse = {
  erro?: boolean;
  logradouro?: string;
  complemento?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
};

export type CepAddress = {
  logradouro: string;
  complemento: string;
  bairro: string;
  city: string;
  state: string;
  country: string;
};

export async function lookupAddressByCep(cep: string): Promise<CepAddress | null> {
  const digits = unmaskDigits(cep);
  if (digits.length !== 8) return null;

  const response = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
  if (!response.ok) {
    throw new Error("Nao foi possivel consultar o CEP.");
  }

  const data = (await response.json()) as ViaCepResponse;
  if (data.erro) return null;

  return {
    logradouro: data.logradouro ?? "",
    complemento: data.complemento ?? "",
    bairro: data.bairro ?? "",
    city: data.localidade ?? "",
    state: data.uf ?? "",
    country: "Brasil",
  };
}
