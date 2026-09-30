import { Link } from 'react-router-dom';
import { formatRelative } from '../../utils/format';

export function ActivityFeed({ items, empty = 'Activity will show up as you create clients and invoices.' }) {
  if (!items?.length) {
    return <p className="px-5 py-8 text-sm text-muted">{empty}</p>;
  }

  return (
    <ul className="divide-y divide-line">
      {items.map((item) => {
        const content = (
          <>
            <p className="text-sm text-navy-900">{item.message}</p>
            <p className="text-xs text-muted">{formatRelative(item.createdAt)}</p>
          </>
        );
        return (
          <li key={item._id}>
            {item.invoice ? (
              <Link to={`/app/invoices/${item.invoice}`} className="block px-5 py-3 hover:bg-mist">{content}</Link>
            ) : (
              <div className="px-5 py-3">{content}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
