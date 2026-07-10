import 'dart:async';
import 'dart:io';

import 'package:audioplayers/audioplayers.dart' as ap;
import 'package:flutter/material.dart';
import 'package:path_provider/path_provider.dart';
import 'package:record/record.dart';

import '../theme.dart';

// file: the recorded voice-note, or null if none yet.
// onChanged(file | null): called once recording stops, or when the user removes it.
class AudioRecorderField extends StatefulWidget {
  final File? file;
  final ValueChanged<File?> onChanged;

  const AudioRecorderField({super.key, required this.file, required this.onChanged});

  @override
  State<AudioRecorderField> createState() => _AudioRecorderFieldState();
}

class _AudioRecorderFieldState extends State<AudioRecorderField> {
  final _recorder = AudioRecorder();
  final _player = ap.AudioPlayer();
  StreamSubscription<ap.PlayerState>? _playerSub;
  Timer? _timer;

  bool _recording = false;
  bool _playing = false;
  Duration _elapsed = Duration.zero;
  String _error = '';

  @override
  void initState() {
    super.initState();
    _playerSub = _player.onPlayerStateChanged.listen((state) {
      if (mounted) setState(() => _playing = state == ap.PlayerState.playing);
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    _playerSub?.cancel();
    _recorder.dispose();
    _player.dispose();
    super.dispose();
  }

  Future<void> _start() async {
    setState(() => _error = '');
    if (!await _recorder.hasPermission()) {
      setState(() => _error = "Autorisez l'accès au micro pour enregistrer une note vocale.");
      return;
    }
    final dir = await getTemporaryDirectory();
    final path = '${dir.path}/voice-${DateTime.now().millisecondsSinceEpoch}.m4a';
    await _recorder.start(const RecordConfig(), path: path);

    final startedAt = DateTime.now();
    setState(() {
      _recording = true;
      _elapsed = Duration.zero;
    });
    _timer = Timer.periodic(const Duration(milliseconds: 200), (_) {
      if (mounted) setState(() => _elapsed = DateTime.now().difference(startedAt));
    });
  }

  Future<void> _stop() async {
    final path = await _recorder.stop();
    _timer?.cancel();
    if (mounted) setState(() => _recording = false);
    if (path != null) widget.onChanged(File(path));
  }

  Future<void> _togglePlayback() async {
    if (widget.file == null) return;
    if (_playing) {
      await _player.pause();
    } else {
      await _player.play(ap.DeviceFileSource(widget.file!.path));
    }
  }

  Future<void> _remove() async {
    await _player.stop();
    widget.onChanged(null);
  }

  @override
  Widget build(BuildContext context) {
    if (widget.file != null) {
      return Container(
        height: 42,
        padding: const EdgeInsets.symmetric(horizontal: 12),
        decoration: BoxDecoration(borderRadius: BorderRadius.circular(kRadius), border: Border.all(color: AppColors.hairline)),
        child: Row(
          children: [
            InkWell(
              onTap: _togglePlayback,
              borderRadius: BorderRadius.circular(13),
              child: Container(
                width: 26,
                height: 26,
                alignment: Alignment.center,
                decoration: const BoxDecoration(color: AppColors.amber, shape: BoxShape.circle),
                child: Text(_playing ? '⏸' : '▶', style: const TextStyle(color: AppColors.amberOn, fontSize: 11)),
              ),
            ),
            const SizedBox(width: 10),
            const Expanded(child: Text('Note vocale enregistrée', style: TextStyle(color: AppColors.textDim, fontSize: 12))),
            InkWell(
              onTap: _remove,
              child: const Padding(
                padding: EdgeInsets.all(4),
                child: Text('✕', style: TextStyle(color: AppColors.textDim, fontSize: 12)),
              ),
            ),
          ],
        ),
      );
    }

    if (_recording) {
      return InkWell(
        onTap: _stop,
        borderRadius: BorderRadius.circular(kRadius),
        child: Container(
          height: 42,
          alignment: Alignment.center,
          decoration: BoxDecoration(borderRadius: BorderRadius.circular(kRadius), border: Border.all(color: AppColors.error)),
          child: Text("Arrêter l'enregistrement · ${_elapsed.inSeconds}s", style: const TextStyle(color: AppColors.error, fontSize: 12)),
        ),
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        InkWell(
          onTap: _start,
          borderRadius: BorderRadius.circular(kRadius),
          child: Container(
            height: 42,
            alignment: Alignment.center,
            decoration: BoxDecoration(borderRadius: BorderRadius.circular(kRadius), border: Border.all(color: AppColors.hairline)),
            child: const Text('🎤 Ajouter une note vocale (facultatif)', style: TextStyle(color: AppColors.teal, fontSize: 12)),
          ),
        ),
        if (_error.isNotEmpty)
          Padding(
            padding: const EdgeInsets.only(top: 6),
            child: Text(_error, style: const TextStyle(color: AppColors.error, fontSize: 11)),
          ),
      ],
    );
  }
}
