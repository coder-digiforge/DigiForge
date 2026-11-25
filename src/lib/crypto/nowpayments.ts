/**
 * NOWPayments API client (sandbox-safe when key missing — returns mock invoice).
 * Docs: https://documenter.getpostman.com/view/7907941/S1a32n38
 */

export type NowPayInvoice = {
  paymentId: string;
  payAddress: string;
  payAmount: number;
  payCurrency: string;
  invoiceUrl?: string;
  simulated: boolean;
};

export type NowPayPayout = {
  id: string;
  txHash?: string;
  status: string;
  simulated: boolean;
};

function apiBase() {
  return (process.env.CRYPTOPAY_API_BASE ?? "https://api.nowpayments.io/v1").replace(/\/$/, "");
}

function apiKey() {
  return process.env.CRYPTOPAY_API_KEY?.trim() ?? "";
}

export function nowPaymentsConfigured() {
  return Boolean(apiKey());
}

function networkToCurrency(network: "TRC20" | "ERC20") {
  return network === "TRC20" ? "usdttrc20" : "usdterc20";
}

export async function createNowPaymentsInvoice(input: {
  depositId: string;
  amountUsdt: number;
  network: "TRC20" | "ERC20";
  ipnCallbackUrl: string;
}): Promise<NowPayInvoice> {
  const key = apiKey();
  if (!key) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("CRYPTOPAY_API_KEY обязателен в production (NOWPayments)");
    }
    // Local / closed-beta without provider keys
    return {
      paymentId: `sim-${input.depositId}`,
      payAddress:
        input.network === "TRC20"
          ? "TDigiForgeEscrowDeposit111111111"
          : "0xDigiForgeEscrowDeposit111111111111",
      payAmount: input.amountUsdt,
      payCurrency: networkToCurrency(input.network),
      simulated: true,
    };
  }

  const res = await fetch(`${apiBase()}/payment`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": key,
    },
    body: JSON.stringify({
      price_amount: input.amountUsdt,
      price_currency: "usdt",
      pay_currency: networkToCurrency(input.network),
      order_id: input.depositId,
      order_description: `DigiForge deposit ${input.depositId}`,
      ipn_callback_url: input.ipnCallbackUrl,
      is_fixed_rate: true,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`NOWPayments invoice failed: ${res.status} ${text.slice(0, 200)}`);
  }

  const data = (await res.json()) as {
    payment_id?: string | number;
    pay_address?: string;
    pay_amount?: number;
    pay_currency?: string;
    invoice_url?: string;
  };

  if (!data.payment_id || !data.pay_address) {
    throw new Error("NOWPayments: incomplete invoice response");
  }

  return {
    paymentId: String(data.payment_id),
    payAddress: data.pay_address,
    payAmount: Number(data.pay_amount ?? input.amountUsdt),
    payCurrency: data.pay_currency ?? networkToCurrency(input.network),
    invoiceUrl: data.invoice_url,
    simulated: false,
  };
}

export async function createNowPaymentsPayout(input: {
  withdrawalId: string;
  amountUsdt: number;
  address: string;
  network: "TRC20" | "ERC20";
}): Promise<NowPayPayout> {
  const key = apiKey();
  if (!key) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("CRYPTOPAY_API_KEY обязателен в production для payout");
    }
    return {
      id: `sim-payout-${input.withdrawalId}`,
      txHash: `payout-${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`,
      status: "FINISHED",
      simulated: true,
    };
  }

  // Mass payouts API — single destination
  const res = await fetch(`${apiBase()}/payout`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": key,
    },
    body: JSON.stringify({
      withdrawals: [
        {
          address: input.address,
          currency: networkToCurrency(input.network),
          amount: input.amountUsdt,
          ipn_callback_url: undefined,
          unique_external_id: input.withdrawalId,
        },
      ],
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`NOWPayments payout failed: ${res.status} ${text.slice(0, 200)}`);
  }

  const data = (await res.json()) as {
    id?: string | number;
    withdrawals?: Array<{ id?: string; hash?: string; status?: string }>;
  };
  const first = data.withdrawals?.[0];
  return {
    id: String(data.id ?? first?.id ?? input.withdrawalId),
    txHash: first?.hash,
    status: first?.status ?? "CREATING",
    simulated: false,
  };
}
