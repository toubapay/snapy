import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/api.dart';
import '../services/auth_provider.dart';
import '../theme/colors.dart';

class AccountScreen extends StatefulWidget {
  const AccountScreen({super.key});

  @override
  State<AccountScreen> createState() => _AccountScreenState();
}

class _AccountScreenState extends State<AccountScreen> {
  final _storeNameCtrl = TextEditingController();
  final _currentPinCtrl = TextEditingController();
  final _newPinCtrl = TextEditingController();

  String _profileMsg = '';
  bool _profileError = false;
  bool _profileSubmitting = false;

  String _pinMsg = '';
  bool _pinError = false;
  bool _pinSubmitting = false;

  bool _deleting = false;

  @override
  void initState() {
    super.initState();
    final auth = context.read<AuthProvider>().auth;
    _storeNameCtrl.text = auth?.storeName ?? '';
    if (auth != null) {
      Api.instance.me(auth.token).then((data) {
        if (!mounted) return;
        _storeNameCtrl.text = (data['storeName'] as String?) ?? '';
        context.read<AuthProvider>().patchStoreName((data['storeName'] as String?) ?? '');
      }).catchError((err) {
        if (err is ApiException && err.status == 401 && mounted) {
          context.read<AuthProvider>().setAuth(null);
          Navigator.of(context).pop();
        }
      });
    }
  }

  Future<void> _saveProfile() async {
    final auth = context.read<AuthProvider>().auth;
    if (auth == null) return;
    setState(() {
      _profileMsg = '';
      _profileSubmitting = true;
    });
    try {
      final data = await Api.instance.updateProfile(auth.token, {'storeName': _storeNameCtrl.text.trim()});
      if (!mounted) return;
      await context.read<AuthProvider>().patchStoreName((data['storeName'] as String?) ?? '');
      setState(() {
        _profileMsg = 'Profil mis à jour.';
        _profileError = false;
      });
    } catch (err) {
      if (err is ApiException && err.status == 401) {
        await context.read<AuthProvider>().setAuth(null);
        if (mounted) Navigator.of(context).pop();
        return;
      }
      setState(() {
        _profileMsg = err is ApiException ? err.message : 'Une erreur s\'est produite.';
        _profileError = true;
      });
    } finally {
      if (mounted) setState(() => _profileSubmitting = false);
    }
  }

  Future<void> _changePin() async {
    final auth = context.read<AuthProvider>().auth;
    if (auth == null) return;
    setState(() {
      _pinMsg = '';
      _pinSubmitting = true;
    });
    try {
      await Api.instance.updateProfile(auth.token, {
        'currentPin': _currentPinCtrl.text.trim(),
        'newPin': _newPinCtrl.text.trim(),
      });
      _currentPinCtrl.clear();
      _newPinCtrl.clear();
      setState(() {
        _pinMsg = 'Code PIN mis à jour.';
        _pinError = false;
      });
    } catch (err) {
      if (err is ApiException && err.status == 401) {
        await context.read<AuthProvider>().setAuth(null);
        if (mounted) Navigator.of(context).pop();
        return;
      }
      setState(() {
        _pinMsg = err is ApiException ? err.message : 'Une erreur s\'est produite.';
        _pinError = true;
      });
    } finally {
      if (mounted) setState(() => _pinSubmitting = false);
    }
  }

  Future<void> _logout() async {
    final auth = context.read<AuthProvider>().auth;
    if (auth != null) Api.instance.logout(auth.token).catchError((_) => null);
    await context.read<AuthProvider>().setAuth(null);
    if (mounted) Navigator.of(context).pop();
  }

  Future<void> _confirmDelete() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: SnapyColors.panel,
        title: const Text('Supprimer le compte', style: TextStyle(color: SnapyColors.paper)),
        content: const Text(
          'Supprimer définitivement votre compte et toutes vos annonces ? Cette action est irréversible.',
          style: TextStyle(color: SnapyColors.textDim),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Annuler')),
          TextButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Supprimer', style: TextStyle(color: SnapyColors.error))),
        ],
      ),
    );
    if (confirmed != true) return;

    final auth = context.read<AuthProvider>().auth;
    if (auth == null) return;
    setState(() => _deleting = true);
    try {
      await Api.instance.deleteAccount(auth.token);
      await context.read<AuthProvider>().setAuth(null);
      if (mounted) Navigator.of(context).pop();
    } catch (err) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(err is ApiException ? err.message : 'Une erreur s\'est produite.')),
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
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(22),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text('Numéro : ${auth.maskedPhone}', style: const TextStyle(color: SnapyColors.textDim, fontSize: 11.5)),
            const SizedBox(height: 18),
            const Text('Nom de la boutique', style: TextStyle(color: SnapyColors.teal, fontSize: 10.5)),
            const SizedBox(height: 6),
            TextField(controller: _storeNameCtrl, maxLength: 40, decoration: const InputDecoration(hintText: 'ex. Boutique Fatou')),
            ElevatedButton(
              onPressed: _profileSubmitting ? null : _saveProfile,
              child: _profileSubmitting
                  ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: SnapyColors.amberOn))
                  : const Text('Enregistrer le profil'),
            ),
            if (_profileMsg.isNotEmpty)
              Padding(
                padding: const EdgeInsets.only(top: 6),
                child: Text(_profileMsg, style: TextStyle(color: _profileError ? SnapyColors.error : SnapyColors.textDim, fontSize: 11)),
              ),
            const Divider(height: 40, color: SnapyColors.hairline),
            const Text('Changer le code PIN', style: TextStyle(color: SnapyColors.teal, fontSize: 10.5)),
            const SizedBox(height: 6),
            TextField(
              controller: _currentPinCtrl,
              obscureText: true,
              keyboardType: TextInputType.number,
              maxLength: 6,
              decoration: const InputDecoration(hintText: 'Code PIN actuel'),
            ),
            const SizedBox(height: 10),
            TextField(
              controller: _newPinCtrl,
              obscureText: true,
              keyboardType: TextInputType.number,
              maxLength: 6,
              decoration: const InputDecoration(hintText: 'Nouveau code PIN (4 à 6 chiffres)'),
            ),
            ElevatedButton(
              onPressed: _pinSubmitting ? null : _changePin,
              child: _pinSubmitting
                  ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: SnapyColors.amberOn))
                  : const Text('Changer le code PIN'),
            ),
            if (_pinMsg.isNotEmpty)
              Padding(
                padding: const EdgeInsets.only(top: 6),
                child: Text(_pinMsg, style: TextStyle(color: _pinError ? SnapyColors.error : SnapyColors.textDim, fontSize: 11)),
              ),
            const Divider(height: 40, color: SnapyColors.hairline),
            Row(
              children: [
                Expanded(child: OutlinedButton(onPressed: _logout, child: const Text('Se déconnecter'))),
                const SizedBox(width: 8),
                Expanded(
                  child: OutlinedButton(
                    style: OutlinedButton.styleFrom(foregroundColor: SnapyColors.error, side: const BorderSide(color: Color(0x66E8756A))),
                    onPressed: _deleting ? null : _confirmDelete,
                    child: Text(_deleting ? 'Suppression…' : 'Supprimer mon compte'),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
