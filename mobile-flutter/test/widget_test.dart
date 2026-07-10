import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';

import 'package:snapy_mobile/auth.dart';
import 'package:snapy_mobile/main.dart';

void main() {
  testWidgets('App boots to the Annonces tab', (WidgetTester tester) async {
    final authProvider = AuthProvider();
    await authProvider.load();

    await tester.pumpWidget(ChangeNotifierProvider.value(value: authProvider, child: const SnapyApp()));
    await tester.pump();

    expect(find.text('Snapy'), findsOneWidget);
  });
}
