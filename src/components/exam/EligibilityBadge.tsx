import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, AlertCircle, Clock } from 'lucide-react';

interface EligibilityBadgeProps {
  status: 'eligible' | 'ineligible' | 'pending';
  reason?: string;
}

const statusConfig = {
  eligible: {
    icon: CheckCircle2,
    label: 'যোগ্য',
    className: 'bg-green-500/10 text-green-600 hover:bg-green-500/20',
  },
  ineligible: {
    icon: XCircle,
    label: 'অযোগ্য',
    className: 'bg-red-500/10 text-red-600 hover:bg-red-500/20',
  },
  pending: {
    icon: Clock,
    label: 'যাচাই বাকি',
    className: 'bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20',
  },
};

export function EligibilityBadge({ status, reason }: EligibilityBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Badge className={`${config.className} font-bangla`} title={reason}>
      <Icon className="w-3 h-3 mr-1" />
      {config.label}
    </Badge>
  );
}
