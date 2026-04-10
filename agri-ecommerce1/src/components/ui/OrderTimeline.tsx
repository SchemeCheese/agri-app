import React from 'react';
import { ShoppingCart, CheckCircle2, Truck, PackageCheck, XCircle, AlertTriangle } from 'lucide-react';

const STEPS = [
  { status: 'PENDING',   label: 'Đặt hàng',     icon: ShoppingCart  },
  { status: 'CONFIRMED', label: 'Xác nhận',      icon: CheckCircle2  },
  { status: 'SHIPPING',  label: 'Đang giao',     icon: Truck         },
  { status: 'COMPLETED', label: 'Hoàn thành',    icon: PackageCheck  },
];

const STATUS_ORDER = ['PENDING', 'CONFIRMED', 'SHIPPING', 'COMPLETED'];

interface OrderTimelineProps {
  currentStatus: string;
}

export function OrderTimeline({ currentStatus }: OrderTimelineProps) {
  const isCancelled     = currentStatus === 'CANCELLED';
  const isFailed        = currentStatus === 'FAILED';
  const isIssueReported = currentStatus === 'ISSUE_REPORTED';

  // Map special statuses to a display index
  const displayStatus = isIssueReported ? 'SHIPPING' : currentStatus;
  const currentIndex  = STATUS_ORDER.indexOf(displayStatus);

  if (isCancelled) {
    return (
      <div className="flex items-center justify-center gap-3 py-3 px-4 bg-red-50 rounded-xl border border-red-100">
        <XCircle size={18} className="text-red-500 flex-shrink-0" />
        <p className="text-sm font-bold text-red-500">Đơn hàng đã bị hủy</p>
      </div>
    );
  }

  if (isFailed) {
    return (
      <div className="flex items-center justify-center gap-3 py-3 px-4 bg-red-50 rounded-xl border border-red-200">
        <XCircle size={18} className="text-red-500 flex-shrink-0" />
        <p className="text-sm font-bold text-red-600">Giao hàng thất bại</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center px-2 py-3">
        {STEPS.map((step, idx) => {
          const isCompleted = idx <= currentIndex;
          const isActive    = idx === currentIndex;
          const Icon = step.icon;

          return (
            <React.Fragment key={step.status}>
              {/* Step node */}
              <div className="flex flex-col items-center flex-shrink-0">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                    isActive && isIssueReported
                      ? 'bg-orange-500 text-white shadow-md shadow-orange-500/30 ring-4 ring-orange-100'
                      : isCompleted
                      ? 'bg-green-600 text-white shadow-md shadow-green-600/30'
                      : 'bg-gray-100 text-gray-400'
                  } ${isActive && !isIssueReported ? 'ring-4 ring-green-100' : ''}`}
                >
                  {isActive && isIssueReported ? <AlertTriangle size={16} /> : <Icon size={16} />}
                </div>
                <p
                  className={`text-[11px] font-semibold mt-1.5 whitespace-nowrap ${
                    isActive && isIssueReported
                      ? 'text-orange-600'
                      : isCompleted
                      ? 'text-green-700'
                      : 'text-gray-400'
                  }`}
                >
                  {step.label}
                </p>
              </div>

              {/* Connector line (không vẽ sau step cuối) */}
              {idx < STEPS.length - 1 && (
                <div className="flex-1 mx-1 mb-5">
                  <div
                    className={`h-1 rounded-full transition-all ${
                      idx < currentIndex ? 'bg-green-500' : 'bg-gray-200'
                    }`}
                  />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Warning banner for ISSUE_REPORTED */}
      {isIssueReported && (
        <div className="flex items-center gap-2 bg-orange-50 rounded-xl px-4 py-2.5 border border-orange-200">
          <AlertTriangle size={14} className="text-orange-500 flex-shrink-0" />
          <p className="text-xs font-semibold text-orange-700">
            Sự cố đã được báo cáo — đang chờ người bán xác nhận tình trạng.
          </p>
        </div>
      )}
    </div>
  );
}
