import 'package:flutter/material.dart';

import '../../core/theme/app_theme.dart';

/// Marca do BarberTime (variação do app prestador): emblema + wordmark com o
/// selo "PRESTADOR" para diferenciar do app cliente.
class BrandLogo extends StatelessWidget {
  const BrandLogo({
    super.key,
    this.size = 64,
    this.showWordmark = true,
    this.showTagline = true,
  });

  final double size;
  final bool showWordmark;
  final bool showTagline;

  @override
  Widget build(BuildContext context) {
    final mark = BrandMark(size: size);
    if (!showWordmark) return mark;

    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        mark,
        SizedBox(height: size * 0.22),
        RichText(
          text: TextSpan(
            style: TextStyle(
              fontSize: size * 0.42,
              fontWeight: FontWeight.w800,
              letterSpacing: 0.5,
              color: AppColors.primary,
            ),
            children: const [
              TextSpan(text: 'Barber'),
              TextSpan(text: 'Time', style: TextStyle(color: AppColors.accent)),
            ],
          ),
        ),
        if (showTagline) ...[
          SizedBox(height: size * 0.08),
          Container(
            padding: EdgeInsets.symmetric(horizontal: size * 0.16, vertical: size * 0.05),
            decoration: BoxDecoration(
              color: AppColors.primary,
              borderRadius: BorderRadius.circular(size),
            ),
            child: Text(
              'PRESTADOR',
              style: TextStyle(
                fontSize: size * 0.15,
                letterSpacing: 3,
                fontWeight: FontWeight.w700,
                color: Colors.white,
              ),
            ),
          ),
        ],
      ],
    );
  }
}

/// Apenas o emblema quadrado (útil em AppBars e listas).
class BrandMark extends StatelessWidget {
  const BrandMark({super.key, this.size = 40});

  final double size;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        gradient: AppColors.brandGradient,
        borderRadius: BorderRadius.circular(size * 0.28),
        boxShadow: [
          BoxShadow(
            color: AppColors.primary.withValues(alpha: 0.30),
            blurRadius: size * 0.25,
            offset: Offset(0, size * 0.08),
          ),
        ],
      ),
      child: Stack(
        alignment: Alignment.center,
        children: [
          Positioned(
            top: size * 0.16,
            child: Container(
              width: size * 0.5,
              height: size * 0.06,
              decoration: BoxDecoration(
                color: AppColors.accent,
                borderRadius: BorderRadius.circular(size),
              ),
            ),
          ),
          Icon(Icons.content_cut, size: size * 0.5, color: Colors.white),
        ],
      ),
    );
  }
}
