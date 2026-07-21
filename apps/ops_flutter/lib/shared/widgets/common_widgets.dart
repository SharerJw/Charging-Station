import 'package:flutter/material.dart';
import 'package:ops_flutter/core/theme/app_theme.dart';

// ──────────────────────────────────────────────────────────────
// StatCard – metric display card (e.g. dashboard KPIs)
// ──────────────────────────────────────────────────────────────

class StatCard extends StatelessWidget {
  final String title;
  final String value;
  final String? unit;
  final IconData? icon;
  final Color? iconColor;
  final Color? valueColor;
  final VoidCallback? onTap;

  const StatCard({
    super.key,
    required this.title,
    required this.value,
    this.unit,
    this.icon,
    this.iconColor,
    this.valueColor,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final card = Card(
      child: Padding(
        padding: const EdgeInsets.all(AppTheme.spacingLg),
        child: Row(
          children: [
            if (icon != null) ...[
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: (iconColor ?? AppTheme.brandBlue).withOpacity(0.1),
                  borderRadius: BorderRadius.circular(AppTheme.radiusMd),
                ),
                child: Icon(icon, color: iconColor ?? AppTheme.brandBlue, size: 22),
              ),
              const SizedBox(width: AppTheme.spacingMd),
            ],
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(title, style: AppTheme.bodySmall),
                  const SizedBox(height: AppTheme.spacingXs),
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.baseline,
                    textBaseline: TextBaseline.alphabetic,
                    children: [
                      Text(
                        value,
                        style: AppTheme.numberLarge.copyWith(
                          color: valueColor ?? AppTheme.textPrimary,
                        ),
                      ),
                      if (unit != null) ...[
                        const SizedBox(width: 4),
                        Text(unit!, style: AppTheme.bodySmall),
                      ],
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );

    if (onTap != null) {
      return GestureDetector(onTap: onTap, child: card);
    }
    return card;
  }
}

// ──────────────────────────────────────────────────────────────
// StatusTag – colored tag for statuses
// ──────────────────────────────────────────────────────────────

class StatusTag extends StatelessWidget {
  final String text;
  final Color? color;
  final bool filled;

  const StatusTag({
    super.key,
    required this.text,
    this.color,
    this.filled = true,
  });

  /// Factory that resolves color from status text automatically.
  StatusTag.fromStatus({super.key, required String status, this.filled = true})
      : text = status,
        color = AppTheme.statusColor(status);

  @override
  Widget build(BuildContext context) {
    final resolvedColor = color ?? AppTheme.info;

    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: AppTheme.spacingSm,
        vertical: AppTheme.spacingXs,
      ),
      decoration: BoxDecoration(
        color: filled ? resolvedColor.withOpacity(0.1) : Colors.transparent,
        borderRadius: BorderRadius.circular(AppTheme.radiusSm),
        border: filled ? null : Border.all(color: resolvedColor, width: 1),
      ),
      child: Text(
        text,
        style: TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.w500,
          color: resolvedColor,
        ),
      ),
    );
  }
}

// ──────────────────────────────────────────────────────────────
// EmptyState – shown when list has no data
// ──────────────────────────────────────────────────────────────

class EmptyState extends StatelessWidget {
  final IconData icon;
  final String title;
  final String? subtitle;
  final String? actionLabel;
  final VoidCallback? onAction;

  const EmptyState({
    super.key,
    this.icon = Icons.inbox_rounded,
    required this.title,
    this.subtitle,
    this.actionLabel,
    this.onAction,
  });

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(AppTheme.spacingXxl),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 64, color: AppTheme.textHint),
            const SizedBox(height: AppTheme.spacingLg),
            Text(title, style: AppTheme.titleMedium.copyWith(color: AppTheme.textSecondary)),
            if (subtitle != null) ...[
              const SizedBox(height: AppTheme.spacingSm),
              Text(subtitle!, style: AppTheme.bodySmall, textAlign: TextAlign.center),
            ],
            if (actionLabel != null && onAction != null) ...[
              const SizedBox(height: AppTheme.spacingXl),
              ElevatedButton(
                onPressed: onAction,
                child: Text(actionLabel!),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

// ──────────────────────────────────────────────────────────────
// LoadingIndicator – centered spinner
// ──────────────────────────────────────────────────────────────

class LoadingIndicator extends StatelessWidget {
  final String? message;

  const LoadingIndicator({super.key, this.message});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const CircularProgressIndicator(color: AppTheme.brandBlue),
          if (message != null) ...[
            const SizedBox(height: AppTheme.spacingLg),
            Text(message!, style: AppTheme.bodySmall),
          ],
        ],
      ),
    );
  }
}

// ──────────────────────────────────────────────────────────────
// ErrorRetryWidget – error state with retry button
// ──────────────────────────────────────────────────────────────

class ErrorRetryWidget extends StatelessWidget {
  final String message;
  final VoidCallback onRetry;

  const ErrorRetryWidget({
    super.key,
    required this.message,
    required this.onRetry,
  });

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(AppTheme.spacingXxl),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(
              Icons.error_outline_rounded,
              size: 64,
              color: AppTheme.error,
            ),
            const SizedBox(height: AppTheme.spacingLg),
            Text(
              message,
              style: AppTheme.bodyMedium.copyWith(color: AppTheme.textSecondary),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: AppTheme.spacingXl),
            OutlinedButton.icon(
              onPressed: onRetry,
              icon: const Icon(Icons.refresh_rounded),
              label: const Text('重试'),
            ),
          ],
        ),
      ),
    );
  }
}
