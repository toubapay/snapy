import 'package:audioplayers/audioplayers.dart' as ap;
import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import '../api.dart';
import '../theme.dart';
import '../time_ago.dart';
import 'boutique_screen.dart';
import 'chat_screen.dart';

class ProductDetailScreen extends StatelessWidget {
  final Product product;

  const ProductDetailScreen({super.key, required this.product});

  @override
  Widget build(BuildContext context) {
    final p = product;
    final imageUrl = p.absoluteImageUrl(Api.base);
    final audioUrl = p.absoluteAudioUrl(Api.base);
    final phoneDigits = digitsOnly(p.contact);

    return Scaffold(
      appBar: AppBar(title: Text(p.name)),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Stack(
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(kRadius),
                child: AspectRatio(
                  aspectRatio: 1,
                  child: Container(color: const Color(0xFF0C0C12), child: Image.network(imageUrl, fit: BoxFit.cover)),
                ),
              ),
              Positioned(
                top: 8,
                left: 8,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(color: const Color(0xBF100F16), borderRadius: BorderRadius.circular(20)),
                  child: Text(p.vendorId, style: const TextStyle(color: AppColors.teal, fontSize: 10)),
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          Text(p.description, style: const TextStyle(fontSize: 14, height: 1.6, color: AppColors.textDim)),
          if (audioUrl != null) ...[
            const SizedBox(height: 12),
            _VoiceNotePlayer(audioUrl: audioUrl),
          ],
          const SizedBox(height: 14),
          GestureDetector(
            onTap: () => Navigator.of(context).push(
              MaterialPageRoute(
                builder: (_) => BoutiqueScreen(phone: p.sellerPhone, label: p.storeName.isNotEmpty ? p.storeName : p.vendorId),
              ),
            ),
            child: Text(
              '🏪 ${p.storeName.isNotEmpty ? p.storeName : p.vendorId}${p.storeName.isNotEmpty ? ' · ${p.ownerLabel.isNotEmpty ? p.ownerLabel : p.vendorId}' : ''}',
              style: const TextStyle(fontSize: 12, color: AppColors.teal),
            ),
          ),
          const SizedBox(height: 16),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              _ActionChip(
                label: '💬 Discuter en direct',
                onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => ChatScreen(product: p), fullscreenDialog: true)),
              ),
              if (phoneDigits.isNotEmpty)
                _ActionChip(
                  label: '📞 Appeler',
                  color: AppColors.amber,
                  borderColor: const Color(0x59E8A33D),
                  onTap: () => launchUrl(Uri.parse('tel:+$phoneDigits')),
                ),
              if (phoneDigits.isNotEmpty)
                _ActionChip(
                  label: '🟢 WhatsApp',
                  color: AppColors.teal,
                  borderColor: const Color(0x595FC3B0),
                  onTap: () => launchUrl(
                    Uri.parse('https://wa.me/$phoneDigits?text=${Uri.encodeComponent("Bonjour ! Je suis intéressé(e) par ${p.name} sur Snapy.")}'),
                    mode: LaunchMode.externalApplication,
                  ),
                ),
            ],
          ),
          const SizedBox(height: 10),
          Text(timeAgo(p.createdAt), style: const TextStyle(fontSize: 10, color: AppColors.hairline)),
        ],
      ),
    );
  }
}

class _VoiceNotePlayer extends StatefulWidget {
  final String audioUrl;

  const _VoiceNotePlayer({required this.audioUrl});

  @override
  State<_VoiceNotePlayer> createState() => _VoiceNotePlayerState();
}

class _VoiceNotePlayerState extends State<_VoiceNotePlayer> {
  final _player = ap.AudioPlayer();
  bool _playing = false;

  @override
  void initState() {
    super.initState();
    _player.onPlayerStateChanged.listen((state) {
      if (mounted) setState(() => _playing = state == ap.PlayerState.playing);
    });
  }

  @override
  void dispose() {
    _player.dispose();
    super.dispose();
  }

  Future<void> _toggle() async {
    if (_playing) {
      await _player.pause();
    } else {
      await _player.play(ap.UrlSource(widget.audioUrl));
    }
  }

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: _toggle,
      borderRadius: BorderRadius.circular(20),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
        decoration: BoxDecoration(
          color: AppColors.panelRaised,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: AppColors.hairline),
        ),
        child: Text(_playing ? '⏸ Note vocale' : '▶ Écouter la note vocale', style: const TextStyle(fontSize: 10.5, color: AppColors.teal)),
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
