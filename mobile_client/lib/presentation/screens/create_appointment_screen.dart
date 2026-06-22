import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';

import '../../core/time/app_time.dart';
import '../../models/availability_slot.dart';
import '../../models/barber.dart';
import '../providers/app_state.dart';

class CreateAppointmentScreen extends StatefulWidget {
  const CreateAppointmentScreen({super.key});

  @override
  State<CreateAppointmentScreen> createState() => _CreateAppointmentScreenState();
}

class _CreateAppointmentScreenState extends State<CreateAppointmentScreen> {
  List<Barber> _barbers = [];
  Barber? _selectedBarber;
  DateTime _selectedDate = _nextWeekday(DateTime.now());
  BarberAvailability? _availability;
  AvailabilitySlot? _selectedSlot;
  bool _loadingBarbers = true;
  bool _loadingSlots = false;
  String? _loadError;

  static DateTime _nextWeekday(DateTime from) {
    var d = DateTime(from.year, from.month, from.day);
    while (d.weekday == DateTime.sunday) {
      d = d.add(const Duration(days: 1));
    }
    return d;
  }

  @override
  void initState() {
    super.initState();
    _loadBarbers();
  }

  Future<void> _loadBarbers() async {
    setState(() {
      _loadingBarbers = true;
      _loadError = null;
    });
    try {
      final items = await context.read<AppState>().loadBarbers();
      if (!mounted) return;
      setState(() {
        _barbers = items;
        _selectedBarber = items.isNotEmpty ? items.first : null;
        _loadingBarbers = false;
      });
      if (_selectedBarber != null) await _loadSlots();
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _loadingBarbers = false;
        _loadError = e.toString();
      });
    }
  }

  Future<void> _loadSlots() async {
    final barber = _selectedBarber;
    if (barber == null) return;
    setState(() {
      _loadingSlots = true;
      _selectedSlot = null;
      _loadError = null;
    });
    try {
      final date = DateFormat('yyyy-MM-dd').format(_selectedDate);
      final result = await context.read<AppState>().loadAvailability(
            barberId: barber.id,
            date: date,
          );
      if (!mounted) return;
      setState(() {
        _availability = result;
        _loadingSlots = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _loadingSlots = false;
        _loadError = e.toString();
      });
    }
  }

  Future<void> _pickDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _selectedDate,
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 60)),
      selectableDayPredicate: (day) => day.weekday != DateTime.sunday,
    );
    if (picked == null) return;
    setState(() => _selectedDate = picked);
    await _loadSlots();
  }

  Future<void> _submit() async {
    final barber = _selectedBarber;
    final slot = _selectedSlot;
    if (barber == null || slot == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Selecione barbeiro e horário.')),
      );
      return;
    }

    final state = context.read<AppState>();
    final created = await state.createAppointment(
      barberId: barber.id,
      startsAt: slot.startsAt,
    );
    if (!mounted) return;
    if (created != null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Agendamento solicitado! Aguardando confirmação do barbeiro.')),
      );
      setState(() => _selectedSlot = null);
      await _loadSlots();
    } else if (state.error != null) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(state.error!)));
      state.clearError();
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppState>();

    if (_loadingBarbers) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_barbers.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Text(_loadError ?? 'Nenhum barbeiro disponível no momento.'),
        ),
      );
    }

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        _sectionLabel(context, 'Barbeiro'),
        DropdownButtonFormField<Barber>(
          initialValue: _selectedBarber,
          decoration: const InputDecoration(prefixIcon: Icon(Icons.person_outline)),
          items: _barbers
              .map((b) => DropdownMenuItem(value: b, child: Text(b.fullName)))
              .toList(),
          onChanged: (b) async {
            setState(() => _selectedBarber = b);
            await _loadSlots();
          },
        ),
        const SizedBox(height: 16),
        _sectionLabel(context, 'Data'),
        Card(
          margin: EdgeInsets.zero,
          child: ListTile(
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
            leading: const Icon(Icons.calendar_today),
            title: Text(_capitalize(DateFormat('EEEE', 'pt_BR').format(_selectedDate))),
            subtitle: Text(DateFormat('dd/MM/yyyy').format(_selectedDate)),
            trailing: const Icon(Icons.edit_calendar_outlined),
            onTap: _pickDate,
          ),
        ),
        const SizedBox(height: 16),
        _sectionLabel(context, 'Horários disponíveis'),
        if (_loadingSlots) const LinearProgressIndicator(),
        if (_loadError != null)
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 8),
            child: Text(_loadError!, style: TextStyle(color: Theme.of(context).colorScheme.error)),
          ),
        if (_availability?.closedToday == true)
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 8),
            child: Text('Barbearia fechada neste dia.'),
          )
        else if (!_loadingSlots && (_availability?.slots.isEmpty ?? true))
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 8),
            child: Text('Nenhum horário livre para esta data.'),
          )
        else if (_availability != null)
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: _availability!.slots.map((slot) {
              final selected = _selectedSlot?.startsAt == slot.startsAt;
              return ChoiceChip(
                label: Text(AppTime.format(slot.startsAt, 'HH:mm')),
                selected: selected,
                onSelected: (_) => setState(() => _selectedSlot = slot),
              );
            }).toList(),
          ),
        const SizedBox(height: 24),
        FilledButton(
          onPressed: state.loading || _selectedSlot == null ? null : _submit,
          child: state.loading
              ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2))
              : const Text('Solicitar agendamento'),
        ),
        const SizedBox(height: 12),
        Text(
          'Após solicitar, o status ficará "Aguardando confirmação". A lista atualiza automaticamente quando o barbeiro confirmar.',
          style: Theme.of(context).textTheme.bodySmall,
        ),
      ],
    );
  }

  Widget _sectionLabel(BuildContext context, String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8, left: 2),
      child: Text(
        text.toUpperCase(),
        style: Theme.of(context).textTheme.labelMedium?.copyWith(
              fontWeight: FontWeight.w700,
              letterSpacing: 0.8,
              color: Theme.of(context).colorScheme.primary.withValues(alpha: 0.7),
            ),
      ),
    );
  }

  static String _capitalize(String s) => s.isEmpty ? s : s[0].toUpperCase() + s.substring(1);
}
