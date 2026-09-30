import { formatMoney } from '../utils/format';
import { useAuth } from '../context/AuthContext';

export function useMoney() {
  const { user } = useAuth();
  const currency = user?.currency || 'INR';
  return (amount) => formatMoney(amount, currency);
}
