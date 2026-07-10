import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../api.dart';
import '../auth.dart';
import '../theme.dart';
import '../widgets/app_field.dart';
import '../widgets/buttons.dart';

class AccountScreen extends StatefulWidget {
  const AccountScreen({super.key});

  @override
  State<AccountScreen> createState() => _AccountScreenState();
}

class _AccountScreenState extends State<AccountScreen> {
  late final TextEditingController _storeNameController;
  final _currentPinController = TextEditingController();
  final _newPinController = TextEditingController();

  String _profileMsg = '';
  bool _profileMsgError = false;
  bool _profileSubmitting = false;

  String _pinMsg = '';
  bool _pinMsgError = false;
  bool _pinSubmitting = false;

  bool _deleting = false;

  @override
  void initState() {
    super.initState();
    final auth = context.read<AuthProvider>().auth;
    _storeNameController = TextEditingController(text: auth?.storeName ?? '');

    if (auth != null) {
      Api.me(auth.token).then((data) {
        final storeName = data['storeName'] ?? '';
        _storeNameController.text = storeName;
        context.read<AuthProvider>().patchStoreName(storeName);
      }).catchError((err) {
        if (err is ApiError && err.status == 401) {
          context.read<AuthProvider>().setAuth(null);
          if (mounted) Navigator.of(context).pop();
        }
      });
    }
  }

  @override
  void dispose() {
    _storeNameController.dispose();
    _currentPinController.dispose();
    _newPinController.dispose();
    super.dispose();
  }

  Future<void> _submitProfile() async {
    setState(() { _profileMsg = ''; _profileMsgError = false; _profileSubmitting = true; });
    final auth = context.read<AuthProvider>().auth!;
    try {
      final data = await Api.updateProfile(auth.token, {'storeName': _storeNameController.text.trim()});
      await context.read<AuthProvider>().patchStoreName(data['storeName'] ?? '');
      setState(() => _profileMsg = 'Profil mis à jour.');
    } on ApiError catch (err) {
      if (err.status == 401) {
        await context.read<AuthProvider>().setAuth(null);
        if (mounted) Navigator.of(context).pop();
        return;
      }
      setState(() { _profileMsg = err.message; _profileMsgError = true; });
    } finally {
      if (mounted) setState(() => _profileSubmitting = false);
    }
  }

  Future<void> _submitPin() async {
    setState(() { _pinMsg = ''; _pinMsgError = false; _pinSubmitting = true; });
    final auth = context.read<AuthProvider>().auth!;
    try {
      await Api.updateProfile(auth.token, {
        'currentPin': _currentPinController.text.trim(),
        'newPin': _newPinController.text.trim(),
      });
      _currentPinController.clear();
      _newPinController.clear();
      setState(() => _pinMsg = 'Code PIN mis à jour.');
    } on ApiError catch (err) {
      if (err.status == 401) {
        await context.read<AuthProvider>().setAuth(null);
        if (mounted) Navigator.of(context).pop();
        return;
      }
      setState(() { _pinMsg = err.message; _pinMsgError = true; });
    } finally {
      if (mounted) setState(() => _pinSubmitting = false);
    }
  }

  Future<void> _logout() async {
    final auth = context.read<AuthProvider>().auth;
    if (auth != null) Api.logout(auth.token).catchError((_) => null);
    await context.read<AuthProvider>().setAuth(null);
    if (mounted) Navigator.of(context).pop();
  }

  Future<void> _confirmDelete() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppColors.panel,
        title: const Text('Supprimer le compte', style: TextStyle(color: AppColors.paper)),
        content: const Text(
          'Supprimer définitivement votre compte et toutes vos annonces ? Cette action est irréversible.',
          style: TextStyle(color: AppColors.textDim),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Annuler')),
          TextButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Supprimer', style: TextStyle(color: AppColors.error))),
        ],
      ),
    );
    if (confirmed == true) _delete();
  }

  Future<void> _delete() async {
    setState(() => _deleting = true);
    final auth = context.read<AuthProvider>().auth!;
    try {
      await Api.deleteAccount(auth.token);
      await context.read<AuthProvider>().setAuth(null);
      if (mounted) Navigator.of(context).pop();
    } catch (err) {
      if (mounted) {
        showDialog(
          context: context,
          builder: (ctx) => AlertDialog(
            backgroundColor: AppColors.panel,
            title: const Text('Erreur', style: TextStyle(color: AppColors.paper)),
            content: Text(err is ApiError ? err.message : "Une erreur s'est produite.", style: const TextStyle(color: AppColors.textDim)),
            actions: [TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('OK'))],
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _deleting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>().auth;
    if (auth == null) return const SizedBox.shrink();

    return Scaffold(
      appBar: AppBar(title: const Text('Mon compte')),
      body: ListView(
        padding: const EdgeInsets.all(22),
        children: [
          Text('Numéro : ${auth.maskedPhone}', style: const TextStyle(color: AppColors.textDim, fontSize: 11.5)),
          const SizedBox(height: 18),
          const Text('Nom de la boutique', style: TextStyle(color: AppColors.teal, fontSize: 10.5)),
          const SizedBox(height: 6),
          AppField(placeholder: 'ex. Boutique Fatou', maxLength: 40, controller: _storeNameController),
          const SizedBox(height: 10),
          PrimaryButton(title: 'Enregistrer le profil', onPressed: _profileSubmitting ? null : _submitProfile, loading: _profileSubmitting),
          if (_profileMsg.isNotEmpty) ...[
            const SizedBox(height: 6),
            Text(_profileMsg, style: TextStyle(color: _profileMsgError ? AppColors.error : AppColors.textDim, fontSize: 11)),
          ],
          const SizedBox(height: 20),
          const Divider(color: AppColors.hairline, height: 1),
          const SizedBox(height: 20),
          const Text('Changer le code PIN', style: TextStyle(color: AppColors.teal, fontSize: 10.5)),
          const SizedBox(height: 6),
          AppField(placeholder: 'Code PIN actuel', obscureText: true, keyboardType: TextInputType.number, maxLength: 6, controller: _currentPinController),
          const SizedBox(height: 10),
          AppField(
            placeholder: 'Nouveau code PIN (4 à 6 chiffres)',
            obscureText: true,
            keyboardType: TextInputType.number,
            maxLength: 6,
            controller: _newPinController,
          ),
          const SizedBox(height: 10),
          PrimaryButton(title: 'Changer le code PIN', onPressed: _pinSubmitting ? null : _submitPin, loading: _pinSubmitting),
          if (_pinMsg.isNotEmpty) ...[
            const SizedBox(height: 6),
            Text(_pinMsg, style: TextStyle(color: _pinMsgError ? AppColors.error : AppColors.textDim, fontSize: 11)),
          ],
          const SizedBox(height: 20),
          const Divider(color: AppColors.hairline, height: 1),
          const SizedBox(height: 20),
          Row(
            children: [
              Expanded(child: SecondaryButton(title: 'Se déconnecter', onPressed: _logout)),
              const SizedBox(width: 8),
              Expanded(child: DangerButton(title: _deleting ? 'Suppression…' : 'Supprimer mon compte', onPressed: _deleting ? null : _confirmDelete)),
            ],
          ),
        ],
      ),
    );
  }
}
