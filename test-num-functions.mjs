// Teste das funções utilitárias do num.ts
import { toNumberBR, asSheetNumber, normalizeTariffKWh } from './server/lib/num.js';

console.log('🧪 Testando funções utilitárias do num.ts...\n');

// Teste 1: toNumberBR
console.log('📊 Teste toNumberBR():');
console.log('toNumberBR("1.234,56") =', toNumberBR("1.234,56"));
console.log('toNumberBR("1234.56") =', toNumberBR("1234.56"));
console.log('toNumberBR("1234,56") =', toNumberBR("1234,56"));
console.log('toNumberBR("abc") =', toNumberBR("abc"));
console.log('toNumberBR(null) =', toNumberBR(null));
console.log('toNumberBR(undefined) =', toNumberBR(undefined));
console.log('toNumberBR(123) =', toNumberBR(123));

// Teste 2: asSheetNumber
console.log('\n📋 Teste asSheetNumber():');
console.log('asSheetNumber("1.234,56", 2) =', asSheetNumber("1.234,56", 2));
console.log('asSheetNumber("1234.56", 3) =', asSheetNumber("1234.56", 3));
console.log('asSheetNumber("abc", 2) =', asSheetNumber("abc", 2));
console.log('asSheetNumber(123.456789, 2) =', asSheetNumber(123.456789, 2));

// Teste 3: normalizeTariffKWh
console.log('\n⚡ Teste normalizeTariffKWh():');
console.log('normalizeTariffKWh("362.600") =', normalizeTariffKWh("362.600")); // R$/MWh -> R$/kWh
console.log('normalizeTariffKWh("0.362") =', normalizeTariffKWh("0.362"));   // R$/kWh (mantém)
console.log('normalizeTariffKWh("0") =', normalizeTariffKWh("0"));

console.log('\n✅ Testes concluídos!');
