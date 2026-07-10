import 'dart:async';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/product.dart';
import '../services/api.dart';
import '../services/auth_provider.dart';
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

class ChatScreen extends StatefulWidget {
  final Product product;
  const ChatScreen({super.key, required this.product});

  @override
  State<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> {
  final _inputCtrl = TextEditingController();
  final _scrollCtrl = ScrollController();
  List<ChatMessage> _messages = [];
  String? _mySenderId;
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _resolveSenderId();
    _poll();
    _timer = Timer.periodic(const Duration(milliseconds: 2500), (_) => _poll());
  }

  Future<void> _resolveSenderId() async {
    final auth = context.read<AuthProvider>().auth;
    final id = auth?.phone ?? await AuthProvider.getBuyerId();
    if (mounted) setState(() => _mySenderId = id);
  }

  Future<void> _poll() async {
    try {
      final data = await Api.instance.chat(widget.product.id);
      if (!mounted) return;
      final list = (data['messages'] as List<dynamic>).map((e) => ChatMessage.fromJson(e as Map<String, dynamic>)).toList();
      setState(() => _messages = list);
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (_scrollCtrl.hasClients) _scrollCtrl.animateTo(_scrollCtrl.position.maxScrollExtent, duration: const Duration(milliseconds: 200), curve: Curves.easeOut);
      });
    } catch (_) {
      /* silent — polling, no need to surface transient errors */
    }
  }

  Future<void> _send() async {
    final text = _inputCtrl.text.trim();
    if (text.isEmpty || _mySenderId == null) return;
    _inputCtrl.clear();
    try {
      await Api.instance.sendChat(widget.product.id, _mySenderId!, text);
      await _poll();
    } catch (_) {
      /* if it fails, the message just won't appear — user can retry */
    }
  }

  @override
  void dispose() {
    _timer?.cancel();
    _inputCtrl.dispose();
    _scrollCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isSeller = _mySenderId == widget.product.sellerPhone;

    return Scaffold(
      appBar: AppBar(title: Text(widget.product.name)),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 10, 16, 0),
            child: Align(
              alignment: Alignment.centerLeft,
              child: Text(
                isSeller ? 'Vous discutez en tant que vendeur' : widget.product.vendorId,
                style: const TextStyle(color: SnapyColors.teal, fontSize: 11),
              ),
            ),
          ),
          Expanded(
            child: ListView.builder(
              controller: _scrollCtrl,
              padding: const EdgeInsets.all(16),
              itemCount: _messages.length,
              itemBuilder: (context, i) {
                final m = _messages[i];
                final mine = m.senderId == _mySenderId;
                return Align(
                  alignment: mine ? Alignment.centerRight : Alignment.centerLeft,
                  child: Container(
                    constraints: const BoxConstraints(maxWidth: 280),
                    margin: const EdgeInsets.only(bottom: 12),
                    child: Column(
                      crossAxisAlignment: mine ? CrossAxisAlignment.end : CrossAxisAlignment.start,
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 13, vertical: 9),
                          decoration: BoxDecoration(
                            color: mine ? SnapyColors.amber : SnapyColors.panelRaised,
                            border: mine ? null : Border.all(color: SnapyColors.hairline),
                            borderRadius: BorderRadius.only(
                              topLeft: const Radius.circular(14),
                              topRight: const Radius.circular(14),
                              bottomLeft: Radius.circular(mine ? 14 : 4),
                              bottomRight: Radius.circular(mine ? 4 : 14),
                            ),
                          ),
                          child: Text(m.text, style: TextStyle(color: mine ? SnapyColors.amberOn : SnapyColors.text, fontSize: 13)),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          '${mine ? 'Vous' : (m.role == 'seller' ? 'Vendeur' : m.senderId)} · ${_timeAgo(m.createdAt)}',
                          style: const TextStyle(color: SnapyColors.textDim, fontSize: 9.5),
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
          ),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: const BoxDecoration(color: SnapyColors.panelRaised, border: Border(top: BorderSide(color: SnapyColors.hairline))),
            child: SafeArea(
              top: false,
              child: Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _inputCtrl,
                      onSubmitted: (_) => _send(),
                      decoration: InputDecoration(
                        hintText: 'Écrire un message…',
                        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(20), borderSide: const BorderSide(color: SnapyColors.hairline)),
                        enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(20), borderSide: const BorderSide(color: SnapyColors.hairline)),
                        focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(20), borderSide: const BorderSide(color: SnapyColors.amber)),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  InkWell(
                    onTap: _send,
                    borderRadius: BorderRadius.circular(20),
                    child: Container(
                      width: 40,
                      height: 40,
                      decoration: const BoxDecoration(color: SnapyColors.amber, shape: BoxShape.circle),
                      alignment: Alignment.center,
                      child: const Text('➤', style: TextStyle(color: SnapyColors.amberOn)),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
