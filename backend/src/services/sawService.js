const round = (value, digits = 6) => Number(Number(value).toFixed(digits));

export function normalizeCustomer(row) {
  const phone = String(row.customer_phone || '').replace(/\D/g, '');
  if (phone) return 'phone:' + phone;
  const name = String(row.customer_name || '').trim().toLocaleLowerCase('id-ID');
  if (!name || ['pelanggan umum', 'umum', 'guest'].includes(name)) return null;
  return 'name:' + name.replace(/\s+/g, ' ');
}

export function calculateSaw(products, transactions, criteria, periodStart, periodEnd) {
  const start = new Date(periodStart + 'T00:00:00Z');
  const end = new Date(periodEnd + 'T00:00:00Z');
  const monthCount = (end.getUTCFullYear() - start.getUTCFullYear()) * 12 + end.getUTCMonth() - start.getUTCMonth() + 1;
  const metrics = new Map(products.map((product) => [Number(product.id), {
    product, raw: [0, 0, 0, 0, 0, 0], customers: new Set(), customerTransactions: new Map(), months: new Set(), transactionIds: new Set(),
  }]));
  for (const row of transactions) {
    const item = metrics.get(Number(row.product_id));
    if (!item) continue;
    const id = Number(row.transaction_id);
    const qty = Number(row.quantity);
    item.raw[0] += qty;
    item.raw[1] = item.transactionIds.add(id).size;
    item.raw[2] += Number(row.subtotal);
    item.months.add(String(row.transaction_date).slice(0, 7));
    const customer = normalizeCustomer(row);
    if (customer) {
      item.customers.add(customer);
      if (!item.customerTransactions.has(customer)) item.customerTransactions.set(customer, new Set());
      item.customerTransactions.get(customer).add(id);
    }
  }
  for (const item of metrics.values()) {
    item.raw[3] = item.customers.size;
    item.raw[4] = [...item.customerTransactions.values()].filter((ids) => ids.size >= 2).length;
    item.raw[5] = item.months.size / monthCount;
  }

  const vectors = [...metrics.values()];
  const normalized = vectors.map((item) => [...item.raw]);
  for (let index = 0; index < 6; index += 1) {
    const type = criteria[index].criterion_type;
    const values = vectors.map((item) => item.raw[index]);
    const max = Math.max(...values);
    const min = Math.min(...values);
    for (let row = 0; row < vectors.length; row += 1) {
      const value = values[row];
      if (type === 'BENEFIT') normalized[row][index] = max > 0 ? value / max : 0;
      else if (type === 'COST') normalized[row][index] = min > 0 ? min / value : (value === 0 ? 1 : 0);
      else throw new Error('Tipe kriteria tidak dikenal.');
    }
  }
  return vectors.map((item, index) => {
    const norm = normalized[index].map((value) => round(value));
    const finalScore = round(norm.reduce((sum, value, criterionIndex) => sum + value * Number(criteria[criterionIndex].weight), 0));
    return { product: item.product, raw: item.raw.map((value) => round(value, 4)), norm, finalScore };
  }).sort((a, b) => b.finalScore - a.finalScore || String(a.product.name).localeCompare(String(b.product.name), 'id'))
    .map((item, index) => ({ ...item, rank: index + 1 }));
}
