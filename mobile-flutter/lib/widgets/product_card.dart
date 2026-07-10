import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../models/product.dart';
import '../services/api.dart';
import '../theme/colors.dart';

String _timeAgo(int ts) {
  final s = (DateTime.now().millisecondsSinceEpoch - ts) ~/ 1000;
  if (s < 60) return "à l'instant";
  final m = s ~/ 60;
  if (m < 60) return 'il y a $m min';
  final h = m ~/ 60;
  if (h < 24) return 'il y a $h h';
  return 'il y a ${h ~/ 24} j';
}

String _digitsOnly(String s) => s.replaceAll(RegExp(r'[^\d]'), '');

class ProductCard extends StatelessWidget {
  final Product product;
  final bool mine;
  final void Function(Product)? onOpenChat;
  final void Function(String phone, String label)? onOpenBoutique;
  final void Function(Product)? onEdit;
  final void Function(String id)? onDelete;

  const ProductCard({
    super.key,
    required this.product,
    this.mine = false,
    this.onOpenChat,
    this.onOpenBoutique,
    this.onEdit,
    this.onDelete,
  });

  @override
  Widget build(BuildContext context) {
    final p = product;
    final imageUrl = p.imageUrl.startsWith('http') ? p.imageUrl : '${Api.base}${p.imageUrl}';

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: SnapyColors.panel,
        borderRadius: BorderRadius.circular(snapyRadius),
        border: Border.all(color: SnapyColors.hairline),
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Stack(
            children: [
              AspectRatio(
                aspectRatio: 1,
                child: Image.network(imageUrl, fit: BoxFit.cover, errorBuilder: (_, __, ___) => const ColoredBox(color: Color(0xFF0C0C12))),
              ),
              Positioned(
                top: 8,
                left: 8,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  constraints: const BoxConstraints(maxWidth: 200),
                  decoration: BoxDecoration(color: Colors.black.withValues(alpha: 0.55), borderRadius: BorderRadius.circular(20)),
                  child: Text(p.vendorId, style: const TextStyle(color: SnapyColors.teal, fontSize: 10), overflow: TextOverflow.ellipsis),
                ),
              ),
            ],
          ),
          Padding(
            padding: const EdgeInsets.all(14),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(p.name, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15, color: SnapyColors.paper)),
                const SizedBox(height: 6),
                Text(p.description, style: const TextStyle(fontSize: 12, height: 1.4, color: SnapyColors.textDim)),
                const SizedBox(height: 10),
                if (!mine)
                  GestureDetector(
                    onTap: () => onOpenBoutique?.call(p.sellerPhone, p.storeName.isNotEmpty ? p.storeName : p.vendorId),
                    child: Text(
                      '🏪 ${p.storeName.isNotEmpty ? p.storeName : p.vendorId}${p.storeName.isNotEmpty ? ' · ${p.ownerLabel}' : ''}',
                      style: const TextStyle(color: SnapyColors.teal, fontSize: 10.5),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                const SizedBox(height: 10),
                Wrap(
                  spacing: 6,
                  runSpacing: 6,
                  children: mine
                      ? [
                          _chip('✏️ Modifier', SnapyColors.hairline, SnapyColors.text, () => onEdit?.call(p)),
                          _chip('🗑️ Supprimer', const Color(0x59E8756A), SnapyColors.error, () => onDelete?.call(p.id)),
                        ]
                      : [
                          _chip('💬 Discuter', SnapyColors.hairline, SnapyColors.text, () => onOpenChat?.call(p)),
                          if (p.contact.isNotEmpty)
                            _chip('🟢 WhatsApp', const Color(0x595FC3B0), SnapyColors.teal, () {
                              final url = Uri.parse(
                                'https://wa.me/${_digitsOnly(p.contact)}?text=${Uri.encodeComponent("Bonjour ! Je suis intéressé(e) par ${p.name} sur Snapy.")}',
                              );
                              launchUrl(url, mode: LaunchMode.externalApplication);
                            }),
                        ],
                ),
                const SizedBox(height: 6),
                Text(_timeAgo(p.createdAt), style: const TextStyle(fontSize: 10, color: SnapyColors.hairline)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _chip(String label, Color borderColor, Color textColor, VoidCallback onTap) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(20),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
        decoration: BoxDecoration(
          color: SnapyColors.panelRaised,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: borderColor),
        ),
        child: Text(label, style: TextStyle(fontSize: 10.5, color: textColor)),
      ),
    );
  }
}
