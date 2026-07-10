import 'dart:async';

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../api.dart';
import '../auth.dart';
import '../theme.dart';
import '../time_ago.dart';
import '../widgets/app_field.dart';

class ChatScreen extends StatefulWidget {
  final Product product;

  const ChatScreen({super.key, required this.product});

  @override
  State<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> {
  final _inputController = TextEditingController();
  final _scrollController = ScrollController();
  List<ChatMessage> _messages = [];
  String? _mySenderId;
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _mySenderId = context.read<AuthProvider>().auth?.phone;
    _resolveSenderId();
    _poll();
    _timer = Timer.periodic(const Duration(milliseconds: 2500), (_) => _poll());
  }

  Future<void> _resolveSenderId() async {
    if (_mySenderId == null) {
      final id = await getBuyerId();
      if (mounted) setState(() => _mySenderId = id);
    }
  }

  @override
  void dispose() {
    _timer?.cancel();
    _inputController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  Future<void> _poll() async {
    try {
      final thread = await Api.chat(widget.product.id);
      if (mounted) {
        setState(() => _messages = thread.messages);
        WidgetsBinding.instance.addPostFrameCallback((_) {
          if (_scrollController.hasClients) {
            _scrollController.animateTo(_scrollController.position.maxScrollExtent, duration: const Duration(milliseconds: 200), curve: Curves.easeOut);
          }
        });
      }
    } catch (_) {
      // polling — a transient failure just waits for the next tick
    }
  }

  Future<void> _send() async {
    final text = _inputController.text.trim();
    if (text.isEmpty || _mySenderId == null) return;
    _inputController.clear();
    try {
      await Api.sendChat(widget.product.id, _mySenderId!, text);
      await _poll();
    } catch (_) {
      // if it fails, the message just won't appear — user can retry
    }
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
                style: const TextStyle(color: AppColors.teal, fontSize: 11),
              ),
            ),
          ),
          Expanded(
            child: ListView.builder(
              controller: _scrollController,
              padding: const EdgeInsets.all(16),
              itemCount: _messages.length,
              itemBuilder: (context, index) {
                final m = _messages[index];
                final mine = m.senderId == _mySenderId;
                return Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: Column(
                    crossAxisAlignment: mine ? CrossAxisAlignment.end : CrossAxisAlignment.start,
                    children: [
                      Container(
                        constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.8),
                        padding: const EdgeInsets.symmetric(horizontal: 13, vertical: 9),
                        decoration: BoxDecoration(
                          color: mine ? AppColors.amber : AppColors.panelRaised,
                          border: mine ? null : Border.all(color: AppColors.hairline),
                          borderRadius: BorderRadius.only(
                            topLeft: const Radius.circular(14),
                            topRight: const Radius.circular(14),
                            bottomLeft: Radius.circular(mine ? 14 : 4),
                            bottomRight: Radius.circular(mine ? 4 : 14),
                          ),
                        ),
                        child: Text(m.text, style: TextStyle(fontSize: 13, color: mine ? AppColors.amberOn : AppColors.text)),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        '${mine ? 'Vous' : (m.role == 'seller' ? 'Vendeur' : m.senderId)} · ${timeAgo(m.createdAt)}',
                        style: const TextStyle(fontSize: 9.5, color: AppColors.textDim),
                      ),
                    ],
                  ),
                );
              },
            ),
          ),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: const BoxDecoration(color: AppColors.panelRaised, border: Border(top: BorderSide(color: AppColors.hairline))),
            child: SafeArea(
              top: false,
              child: Row(
                children: [
                  Expanded(child: AppField(placeholder: 'Écrire un message…', controller: _inputController, onSubmitted: (_) => _send())),
                  const SizedBox(width: 8),
                  InkWell(
                    onTap: _send,
                    borderRadius: BorderRadius.circular(20),
                    child: Container(
                      width: 40,
                      height: 40,
                      alignment: Alignment.center,
                      decoration: const BoxDecoration(color: AppColors.amber, shape: BoxShape.circle),
                      child: const Text('➤', style: TextStyle(color: AppColors.amberOn, fontSize: 15)),
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
