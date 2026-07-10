import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import '../api.dart';
import '../theme.dart';
import '../time_ago.dart';

class ProductCard extends StatelessWidget {
  final Product product;
  final bool mine;
  final void Function(Product) onOpenChat;
  final void Function(String phone, String label) onOpenBoutique;
  final void Function(Product) onEdit;
  final void Function(String id) onDelete;

  const ProductCard({
    super.key,
    required this.product,
    required this.mine,
    required this.onOpenChat,
    required this.onOpenBoutique,
    required this.onEdit,
    required this.onDelete,
  });

  @override
  Widget build(BuildContext context) {
    final p = product;
    final imageUrl = p.absoluteImageUrl(Api.base);

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: AppColors.panel,
        borderRadius: BorderRadius.circular(kRadius),
        border: Border.all(color: AppColors.hairline),
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Stack(
            children: [
              AspectRatio(
                aspectRatio: 1,
                child: Container(
                  color: const Color(0xFF0C0C12),
                  child: Image.network(imageUrl, fit: BoxFit.cover),
                ),
              ),
              Positioned(
                top: 8,
                left: 8,
                child: Container(
                  constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.6),
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(color: const Color(0xBF100F16), borderRadius: BorderRadius.circular(20)),
                  child: Text(p.vendorId, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(color: AppColors.teal, fontSize: 10)),
                ),
              ),
            ],
          ),
          Container(
            padding: const EdgeInsets.all(14),
            decoration: const BoxDecoration(border: Border(top: BorderSide(color: AppColors.hairline))),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(p.name, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15, color: AppColors.paper)),
                const SizedBox(height: 6),
                Text(p.description, style: const TextStyle(fontSize: 12, height: 1.5, color: AppColors.textDim)),
                const SizedBox(height: 10),
                if (!mine)
                  GestureDetector(
                    onTap: () => onOpenBoutique(p.sellerPhone, p.storeName.isNotEmpty ? p.storeName : p.vendorId),
                    child: Padding(
                      padding: const EdgeInsets.only(bottom: 10),
                      child: Text(
                        '🏪 ${p.storeName.isNotEmpty ? p.storeName : p.vendorId}${p.storeName.isNotEmpty ? ' · ${p.ownerLabel.isNotEmpty ? p.ownerLabel : p.vendorId}' : ''}',
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(fontSize: 10.5, color: AppColors.teal),
                      ),
                    ),
                  ),
                Wrap(
                  spacing: 6,
                  runSpacing: 6,
                  children: mine
                      ? [
                          _ActionChip(label: '✏️ Modifier', onTap: () => onEdit(p)),
                          _ActionChip(label: '🗑️ Supprimer', color: AppColors.error, borderColor: const Color(0x59E8756A), onTap: () => onDelete(p.id)),
                        ]
                      : [
                          _ActionChip(label: '💬 Discuter', onTap: () => onOpenChat(p)),
                          if (p.contact.isNotEmpty)
                            _ActionChip(
                              label: '🟢 WhatsApp',
                              color: AppColors.teal,
                              borderColor: const Color(0x595FC3B0),
                              onTap: () => launchUrl(
                                Uri.parse(
                                  'https://wa.me/${digitsOnly(p.contact)}?text=${Uri.encodeComponent("Bonjour ! Je suis intéressé(e) par ${p.name} sur Snapy.")}',
                                ),
                                mode: LaunchMode.externalApplication,
                              ),
                            ),
                        ],
                ),
                const SizedBox(height: 6),
                Text(timeAgo(p.createdAt), style: const TextStyle(fontSize: 10, color: AppColors.hairline)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _ActionChip extends StatelessWidget {
  final String label;
  final Color? color;
  final Color? borderColor;
  final VoidCallback onTap;

  const _ActionChip({required this.label, required this.onTap, this.color, this.borderColor});

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(20),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
        decoration: BoxDecoration(
          color: AppColors.panelRaised,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: borderColor ?? AppColors.hairline),
        ),
        child: Text(label, style: TextStyle(fontSize: 10.5, color: color ?? AppColors.text)),
      ),
    );
  }
}
