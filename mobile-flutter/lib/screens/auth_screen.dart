import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/api.dart';
import '../services/auth_provider.dart';
import '../theme/colors.dart';

class AuthScreen extends StatefulWidget {
  final bool startInRegister;
  const AuthScreen({super.key, this.startInRegister = false});

  @override
  State<AuthScreen> createState() => _AuthScreenState();
}

class _AuthScreenState extends State<AuthScreen> {
  late bool _isLogin = !widget.startInRegister;
  final _phoneCtrl = TextEditingController();
  final _pinCtrl = TextEditingController();
  final _storeNameCtrl = TextEditingController();
  String _error = '';
  bool _submitting = false;

  Future<void> _submit() async {
    setState(() {
      _error = '';
      _submitting = true;
    });
    try {
      final data = _isLogin
          ? await Api.instance.login(_phoneCtrl.text.trim(), _pinCtrl.text.trim())
          : await Api.instance.register(_phoneCtrl.text.trim(), _pinCtrl.text.trim(), _storeNameCtrl.text.trim());
      if (!mounted) return;
      await context.read<AuthProvider>().setAuth(SellerAuth.fromJson(data));
      if (!mounted) return;
      Navigator.of(context).pop();
    } catch (err) {
      setState(() => _error = err is ApiException ? err.message : 'Une erreur s\'est produite.');
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Compte vendeur')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(22),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    style: OutlinedButton.styleFrom(
                      side: BorderSide(color: _isLogin ? SnapyColors.amber : SnapyColors.hairline),
                      foregroundColor: _isLogin ? SnapyColors.amber : SnapyColors.textDim,
                    ),
                    onPressed: () => setState(() => _isLogin = true),
                    child: const Text('Connexion'),
                  ),
                ),
                const SizedBox(width: 6),
                Expanded(
                  child: OutlinedButton(
                    style: OutlinedButton.styleFrom(
                      side: BorderSide(color: !_isLogin ? SnapyColors.amber : SnapyColors.hairline),
                      foregroundColor: !_isLogin ? SnapyColors.amber : SnapyColors.textDim,
                    ),
                    onPressed: () => setState(() => _isLogin = false),
                    child: const Text('Inscription'),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            Text(
              _isLogin
                  ? 'Connectez-vous avec votre numéro de téléphone vendeur et votre code PIN.'
                  : 'Inscrivez-vous avec un numéro de téléphone et un code PIN de 4 à 6 chiffres — aucun e-mail requis.',
              style: const TextStyle(color: SnapyColors.textDim, fontSize: 12, height: 1.4),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: _phoneCtrl,
              keyboardType: TextInputType.phone,
              decoration: const InputDecoration(hintText: 'Numéro de téléphone — ex. +221771234567'),
            ),
            const SizedBox(height: 10),
            TextField(
              controller: _pinCtrl,
              keyboardType: TextInputType.number,
              obscureText: true,
              maxLength: 6,
              decoration: const InputDecoration(hintText: 'Code PIN (4 à 6 chiffres)'),
            ),
            if (!_isLogin) ...[
              const SizedBox(height: 10),
              TextField(
                controller: _storeNameCtrl,
                maxLength: 40,
                decoration: const InputDecoration(hintText: 'Nom de la boutique (facultatif)'),
              ),
            ],
            const SizedBox(height: 6),
            ElevatedButton(
              onPressed: _submitting ? null : _submit,
              child: _submitting
                  ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: SnapyColors.amberOn))
                  : Text(_isLogin ? 'Se connecter' : 'Créer un compte'),
            ),
            if (_error.isNotEmpty) ...[
              const SizedBox(height: 8),
              Text(_error, style: const TextStyle(color: SnapyColors.error, fontSize: 11.5)),
            ],
          ],
        ),
      ),
    );
  }
}
