import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../api.dart';
import '../auth.dart';
import '../theme.dart';
import '../widgets/app_field.dart';
import '../widgets/buttons.dart';

class AuthScreen extends StatefulWidget {
  final String initialMode;

  const AuthScreen({super.key, this.initialMode = 'login'});

  @override
  State<AuthScreen> createState() => _AuthScreenState();
}

class _AuthScreenState extends State<AuthScreen> {
  late String _mode = widget.initialMode;
  final _phoneController = TextEditingController();
  final _pinController = TextEditingController();
  final _storeNameController = TextEditingController();
  String _error = '';
  bool _submitting = false;

  @override
  void dispose() {
    _phoneController.dispose();
    _pinController.dispose();
    _storeNameController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    setState(() { _error = ''; _submitting = true; });
    try {
      final data = _mode == 'login'
          ? await Api.login(_phoneController.text.trim(), _pinController.text.trim())
          : await Api.register(_phoneController.text.trim(), _pinController.text.trim(), _storeNameController.text.trim());
      await context.read<AuthProvider>().setAuth(data);
      if (mounted) Navigator.of(context).pop();
    } on ApiError catch (err) {
      setState(() => _error = err.message);
    } catch (_) {
      setState(() => _error = "Une erreur s'est produite.");
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Compte vendeur')),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(22),
          children: [
            Row(
              children: [
                Expanded(child: _TabButton(label: 'Connexion', active: _mode == 'login', onTap: () => setState(() => _mode = 'login'))),
                const SizedBox(width: 6),
                Expanded(child: _TabButton(label: 'Inscription', active: _mode == 'register', onTap: () => setState(() => _mode = 'register'))),
              ],
            ),
            const SizedBox(height: 14),
            Text(
              _mode == 'login'
                  ? 'Connectez-vous avec votre numéro de téléphone vendeur et votre code PIN.'
                  : 'Inscrivez-vous avec un numéro de téléphone et un code PIN de 4 à 6 chiffres — aucun e-mail requis.',
              style: const TextStyle(color: AppColors.textDim, fontSize: 12, height: 1.5),
            ),
            const SizedBox(height: 16),
            AppField(placeholder: 'Numéro de téléphone — ex. +221771234567', keyboardType: TextInputType.phone, controller: _phoneController),
            const SizedBox(height: 10),
            AppField(placeholder: 'Code PIN (4 à 6 chiffres)', keyboardType: TextInputType.number, obscureText: true, maxLength: 6, controller: _pinController),
            if (_mode == 'register') ...[
              const SizedBox(height: 10),
              AppField(placeholder: 'Nom de la boutique (facultatif)', maxLength: 40, controller: _storeNameController),
            ],
            const SizedBox(height: 10),
            PrimaryButton(title: _mode == 'login' ? 'Se connecter' : 'Créer un compte', onPressed: _submitting ? null : _submit, loading: _submitting),
            if (_error.isNotEmpty) ...[
              const SizedBox(height: 8),
              Text(_error, style: const TextStyle(color: AppColors.error, fontSize: 11.5)),
            ],
          ],
        ),
      ),
    );
  }
}

class _TabButton extends StatelessWidget {
  final String label;
  final bool active;
  final VoidCallback onTap;

  const _TabButton({required this.label, required this.active, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(20),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 8),
        alignment: Alignment.center,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: active ? AppColors.amber : AppColors.hairline),
          color: active ? const Color(0x14E8A33D) : null,
        ),
        child: Text(label, style: TextStyle(fontSize: 12, color: active ? AppColors.amber : AppColors.textDim)),
      ),
    );
  }
}
