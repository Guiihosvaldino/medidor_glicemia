from datetime import datetime
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from django.views.decorators.csrf import csrf_exempt
from django.shortcuts import get_object_or_404
from django.db.models import Avg, Q
from rest_framework.authtoken.models import Token
from .models import AutorizacaoAcesso, Medicao, PerfilUsuario, PerfilMedico, Medicamento, TaxaCorrecao

@api_view(['POST'])
def api_cadastro_paciente(request):
    data = request.data
    nome = data.get('nome')
    email = data.get('email')
    cpf = data.get('cpf', '').replace('.', '').replace('-', '')
    data_nasc = data.get('data_nascimento')
    senha = data.get('senha')

    if not email or not senha:
        return Response({'sucesso': False, 'mensagem': 'Email e senha são obrigatórios.'}, status=status.HTTP_400_BAD_REQUEST)

    if User.objects.filter(username=email).exists():
        return Response({'sucesso': False, 'mensagem': 'Este e-mail já está cadastrado.'}, status=status.HTTP_400_BAD_REQUEST)

    user = User.objects.create_user(username=email, email=email, password=senha, first_name=nome)
    PerfilUsuario.objects.create(user=user, cpf=cpf, data_nascimento=data_nasc)
    
    token, _ = Token.objects.get_or_create(user=user)

    return Response({
        'sucesso': True, 
        'mensagem': 'Cadastro realizado com sucesso!',
        'token': token.key,
        'tipo_usuario': 'paciente'
    }, status=status.HTTP_201_CREATED)


@api_view(['POST'])
def api_cadastro_medico(request):
    data = request.data
    nome = data.get('nome')
    email = data.get('email')
    tipo_registro = data.get('tipo_registro', 'CRM')
    registro_num = data.get('registro_num', '')
    uf = data.get('uf', '').upper().strip()
    senha = data.get('senha')

    if not email or not senha:
        return Response({'sucesso': False, 'mensagem': 'Email e senha são obrigatórios.'}, status=status.HTTP_400_BAD_REQUEST)

    if not registro_num:
        return Response({'sucesso': False, 'mensagem': 'Número de registro é obrigatório.'}, status=status.HTTP_400_BAD_REQUEST)

    # Monta o CRM combinando tipo (CRM/CRN) + número
    crm = f"{tipo_registro}-{registro_num}"

    if User.objects.filter(username=email).exists():
        return Response({'sucesso': False, 'mensagem': 'Este e-mail já está cadastrado.'}, status=status.HTTP_400_BAD_REQUEST)

    if PerfilMedico.objects.filter(crm=crm, uf=uf).exists():
        return Response({'sucesso': False, 'mensagem': f'{tipo_registro} já cadastrado para este estado.'}, status=status.HTTP_400_BAD_REQUEST)

    user = User.objects.create_user(username=email, email=email, password=senha, first_name=nome)
    PerfilMedico.objects.create(
        user=user,
        crm=crm,
        uf=uf
    )

    token, _ = Token.objects.get_or_create(user=user)

    return Response({
        'sucesso': True,
        'mensagem': 'Cadastro de médico realizado com sucesso!',
        'token': token.key,
        'tipo_usuario': 'medico'
    }, status=status.HTTP_201_CREATED)


@api_view(['POST'])
def api_login(request):
    data = request.data
    username = data.get('username')  # que é o email
    password = data.get('password')
    tipo_usuario_esperado = data.get('tipo_usuario', 'paciente') # 'paciente' ou 'medico'

    user = authenticate(username=username, password=password)

    if user is not None:
        is_medico = PerfilMedico.objects.filter(user=user).exists()

        if tipo_usuario_esperado == 'paciente' and is_medico:
            return Response({'sucesso': False, 'mensagem': 'Profissionais devem acessar o Portal do Médico.'}, status=status.HTTP_403_FORBIDDEN)
        
        if tipo_usuario_esperado == 'medico' and not is_medico:
            return Response({'sucesso': False, 'mensagem': 'Acesso exclusivo para Médicos/Nutricionistas.'}, status=status.HTTP_403_FORBIDDEN)

        token, _ = Token.objects.get_or_create(user=user)
        
        return Response({
            'sucesso': True,
            'success': True,
            'token': token.key,
            'tipo_usuario': 'medico' if is_medico else 'paciente',
            'nome': user.first_name,
            'message': 'Login realizado com sucesso!'
        })
    else:
        return Response({'sucesso': False, 'success': False, 'mensagem': 'E-mail ou senha incorretos.', 'error': 'E-mail ou senha incorretos.'}, status=status.HTTP_401_UNAUTHORIZED)


@api_view(['GET', 'POST'])
@csrf_exempt
def api_perfil_paciente(request):
    auth_header = request.META.get('HTTP_AUTHORIZATION', '')
    if auth_header.startswith('Token '):
        token_key = auth_header.split(' ')[1]
        try:
            token = Token.objects.get(key=token_key)
            request.user = token.user
        except Token.DoesNotExist:
            pass

    if not request.user or not request.user.is_authenticated:
        return Response({'sucesso': False, 'mensagem': 'Não autenticado.'}, status=status.HTTP_401_UNAUTHORIZED)

    if hasattr(request.user, 'perfil_medico'):
        return Response({'sucesso': False, 'mensagem': 'Acesso restrito a pacientes.'}, status=status.HTTP_403_FORBIDDEN)

    perfil = getattr(request.user, 'perfil', None)
    if not perfil:
        return Response({'sucesso': False, 'mensagem': 'Perfil de paciente não encontrado.'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        foto_url = ''
        if perfil.foto_perfil:
            foto_url = request.build_absolute_uri(perfil.foto_perfil.url)

        return Response({
            'sucesso': True,
            'nome': request.user.first_name,
            'email': request.user.email,
            'cpf': perfil.cpf,
            'data_nascimento': perfil.data_nascimento.isoformat() if perfil.data_nascimento else '',
            'foto_perfil_url': foto_url,
        })

    nome = request.POST.get('nome', '').strip()
    email = request.POST.get('email', '').strip()
    cpf = request.POST.get('cpf', '').strip()
    data_nascimento = request.POST.get('data_nascimento', '').strip()
    senha = request.POST.get('senha', '').strip()
    confirmar_senha = request.POST.get('confirmar_senha', '').strip()

    if (senha or confirmar_senha) and senha != confirmar_senha:
        return Response({'sucesso': False, 'mensagem': 'A senha e a confirmação precisam ser iguais.'}, status=status.HTTP_400_BAD_REQUEST)

    if email and User.objects.filter(username=email).exclude(id=request.user.id).exists():
        return Response({'sucesso': False, 'mensagem': 'Este e-mail já está em uso.'}, status=status.HTTP_400_BAD_REQUEST)

    if cpf and PerfilUsuario.objects.filter(cpf=cpf).exclude(user=request.user).exists():
        return Response({'sucesso': False, 'mensagem': 'Este CPF já está em uso.'}, status=status.HTTP_400_BAD_REQUEST)

    if nome:
        request.user.first_name = nome
    if email:
        request.user.username = email
        request.user.email = email
    if senha:
        request.user.set_password(senha)
    request.user.save()

    if cpf:
        perfil.cpf = cpf
    if data_nascimento:
        perfil.data_nascimento = data_nascimento
    if 'foto_perfil' in request.FILES:
        perfil.foto_perfil = request.FILES['foto_perfil']
    perfil.save()

    foto_url = request.build_absolute_uri(perfil.foto_perfil.url) if perfil.foto_perfil else ''
    return Response({
        'sucesso': True,
        'mensagem': 'Perfil atualizado com sucesso.',
        'foto_perfil_url': foto_url,
    })


@api_view(['GET', 'POST'])
@csrf_exempt
def api_perfil_medico(request):
    auth_header = request.META.get('HTTP_AUTHORIZATION', '')
    if auth_header.startswith('Token '):
        token_key = auth_header.split(' ')[1]
        try:
            token = Token.objects.get(key=token_key)
            request.user = token.user
        except Token.DoesNotExist:
            pass

    if not request.user or not request.user.is_authenticated:
        return Response({'sucesso': False, 'mensagem': 'Não autenticado.'}, status=status.HTTP_401_UNAUTHORIZED)

    if not hasattr(request.user, 'perfil_medico'):
        return Response({'sucesso': False, 'mensagem': 'Acesso restrito a médicos.'}, status=status.HTTP_403_FORBIDDEN)

    perfil = request.user.perfil_medico

    if request.method == 'GET':
        foto_url = ''
        if perfil.foto_perfil:
            foto_url = request.build_absolute_uri(perfil.foto_perfil.url)

        return Response({
            'sucesso': True,
            'nome': request.user.first_name,
            'email': request.user.email,
            'cpf': getattr(perfil, 'cpf', ''),
            'telefone': getattr(perfil, 'telefone', ''),
            'tipo_registro': getattr(perfil, 'tipo_registro', ''),
            'registro_num': getattr(perfil, 'registro_num', ''),
            'uf': getattr(perfil, 'uf', ''),
            'crm': getattr(perfil, 'crm', ''),
            'foto_perfil_url': foto_url,
        })

    nome = request.POST.get('nome', '').strip()
    email = request.POST.get('email', '').strip()
    cpf = request.POST.get('cpf', '').strip()
    telefone = request.POST.get('telefone', '').strip()
    tipo_registro = request.POST.get('tipo_registro', '').strip()
    registro_num = request.POST.get('registro_num', '').strip()
    uf = request.POST.get('uf', '').strip()
    senha = request.POST.get('senha', '').strip()
    confirmar_senha = request.POST.get('confirmar_senha', '').strip()

    if (senha or confirmar_senha) and senha != confirmar_senha:
        return Response({'sucesso': False, 'mensagem': 'A senha e a confirmação precisam ser iguais.'}, status=status.HTTP_400_BAD_REQUEST)

    if email and User.objects.filter(username=email).exclude(id=request.user.id).exists():
        return Response({'sucesso': False, 'mensagem': 'Este e-mail já está em uso.'}, status=status.HTTP_400_BAD_REQUEST)

    if hasattr(perfil, 'cpf') and cpf and PerfilMedico.objects.filter(cpf=cpf).exclude(id=perfil.id).exists():
        return Response({'sucesso': False, 'mensagem': 'Este CPF já está em uso.'}, status=status.HTTP_400_BAD_REQUEST)

    if nome:
        request.user.first_name = nome
    if email:
        request.user.username = email
        request.user.email = email
    if senha:
        request.user.set_password(senha)
    request.user.save()

    if hasattr(perfil, 'cpf') and cpf:
        perfil.cpf = cpf
    if hasattr(perfil, 'telefone'):
        perfil.telefone = telefone
    if hasattr(perfil, 'tipo_registro'):
        perfil.tipo_registro = tipo_registro
    if hasattr(perfil, 'registro_num'):
        perfil.registro_num = registro_num
    if hasattr(perfil, 'uf'):
        perfil.uf = uf
    if 'foto_perfil' in request.FILES:
        perfil.foto_perfil = request.FILES['foto_perfil']
    perfil.save()

    foto_url = request.build_absolute_uri(perfil.foto_perfil.url) if perfil.foto_perfil else ''
    return Response({
        'sucesso': True,
        'mensagem': 'Perfil atualizado com sucesso.',
        'foto_perfil_url': foto_url,
    })


@api_view(['GET'])
@csrf_exempt
def api_dashboard_medico(request):
    auth_header = request.META.get('HTTP_AUTHORIZATION', '')
    if auth_header.startswith('Token '):
        token_key = auth_header.split(' ')[1]
        try:
            token = Token.objects.get(key=token_key)
            request.user = token.user
        except Token.DoesNotExist:
            pass

    if not request.user or not request.user.is_authenticated:
        return Response({'sucesso': False, 'mensagem': 'Não autenticado.'}, status=status.HTTP_401_UNAUTHORIZED)

    if not hasattr(request.user, 'perfil_medico'):
        return Response({'sucesso': False, 'mensagem': 'Acesso restrito a médicos.'}, status=status.HTTP_403_FORBIDDEN)

    cpf_buscado = request.GET.get('cpf', '').strip()
    if not cpf_buscado:
        return Response({'sucesso': False, 'mensagem': 'CPF do paciente é obrigatório.'}, status=status.HTTP_400_BAD_REQUEST)

    cpf_limpo = ''.join(filter(str.isdigit, cpf_buscado))
    paciente_usuario = None

    if cpf_limpo:
        perfil = PerfilUsuario.objects.filter(cpf__icontains=cpf_limpo).first()
        if perfil:
            paciente_usuario = perfil.user

    if not paciente_usuario:
        paciente_usuario = User.objects.filter(
            Q(username__icontains=cpf_buscado) |
            Q(email__icontains=cpf_buscado) |
            Q(first_name__icontains=cpf_buscado)
        ).first()

    if not paciente_usuario:
        return Response({'sucesso': False, 'mensagem': 'Paciente não localizado.'}, status=status.HTTP_404_NOT_FOUND)

    autorizacao = AutorizacaoAcesso.objects.filter(
        medico=request.user,
        paciente=paciente_usuario
    ).first()

    if autorizacao is None:
        AutorizacaoAcesso.objects.create(
            medico=request.user,
            paciente=paciente_usuario,
            status='pendente'
        )
        return Response({
            'sucesso': False,
            'status': 'pendente',
            'mensagem': 'O paciente precisa autorizar o acesso antes de visualizar os dados.'
        }, status=status.HTTP_200_OK)

    if autorizacao.status != 'aprovado':
        return Response({
            'sucesso': False,
            'status': autorizacao.status,
            'mensagem': 'Acesso ainda não foi aprovado pelo paciente.'
        }, status=status.HTTP_200_OK)

    mes = request.GET.get('mes')
    ano = request.GET.get('ano')
    hoje = datetime.now()

    try:
        mes = int(mes) if mes else hoje.month
    except ValueError:
        mes = hoje.month
    try:
        ano = int(ano) if ano else hoje.year
    except ValueError:
        ano = hoje.year

    medicoes_qs = Medicao.objects.filter(
        usuario=paciente_usuario,
        data__month=mes,
        data__year=ano
    ).order_by('-data', '-hora')

    total = medicoes_qs.count()
    media_val = medicoes_qs.aggregate(media=Avg('valor'))['media']
    media_val = round(media_val, 2) if media_val else 0
    glicada_estimada = round((media_val + 46.7) / 28.7, 2) if media_val > 0 else 0

    hipo_count = medicoes_qs.filter(valor__lt=70).count()
    hiper_count = medicoes_qs.filter(valor__gte=180).count()
    alvo_count = total - hipo_count - hiper_count
    pct_hipo = round((hipo_count / total) * 100) if total > 0 else 0
    pct_hiper = round((hiper_count / total) * 100) if total > 0 else 0
    pct_alvo = 100 - pct_hipo - pct_hiper

    paciente_data = {
        'nome': f"{paciente_usuario.first_name} {paciente_usuario.last_name}".strip() or paciente_usuario.username,
        'cpf': getattr(paciente_usuario.perfil, 'cpf', paciente_usuario.username),
        'total_medicoes': total,
        'media_mes': media_val,
        'glicada_estimada': glicada_estimada,
        'user_id': paciente_usuario.id,
        'pct_hipo': pct_hipo,
        'pct_hiper': pct_hiper,
        'pct_alvo': pct_alvo,
    }

    medicoes = [
        {
            'id': m.id,
            'valor': m.valor,
            'data': m.data.isoformat(),
            'hora': m.hora.strftime('%H:%M:%S'),
            'tipo': m.tipo,
            'notes': m.notes,
        }
        for m in medicoes_qs.order_by('data', 'hora')
    ]

    return Response({
        'sucesso': True,
        'paciente': paciente_data,
        'medicoes': medicoes,
    })


@api_view(['GET'])
@csrf_exempt
def api_autorizacoes_paciente(request):
    auth_header = request.META.get('HTTP_AUTHORIZATION', '')
    if auth_header.startswith('Token '):
        token_key = auth_header.split(' ')[1]
        try:
            token = Token.objects.get(key=token_key)
            request.user = token.user
        except Token.DoesNotExist:
            pass

    if not request.user or not request.user.is_authenticated:
        return Response({'sucesso': False, 'mensagem': 'Não autenticado.'}, status=status.HTTP_401_UNAUTHORIZED)

    if hasattr(request.user, 'perfil_medico'):
        return Response({'sucesso': False, 'mensagem': 'Acesso restrito a pacientes.'}, status=status.HTTP_403_FORBIDDEN)

    autorizacoes = AutorizacaoAcesso.objects.filter(paciente=request.user).order_by('-criado_em')
    dados = []
    for autorizacao in autorizacoes:
        perfil_medico = getattr(autorizacao.medico, 'perfil_medico', None)
        dados.append({
            'id': autorizacao.id,
            'medico_id': autorizacao.medico.id,
            'medico_nome': autorizacao.medico.first_name or autorizacao.medico.username,
            'medico_email': autorizacao.medico.email,
            'crm': perfil_medico.crm if perfil_medico else '',
            'uf': perfil_medico.uf if perfil_medico else '',
            'status': autorizacao.status,
            'criado_em': autorizacao.criado_em.strftime('%Y-%m-%d %H:%M:%S'),
        })

    return Response({'sucesso': True, 'autorizacoes': dados})


@api_view(['POST'])
@csrf_exempt
def api_autorizacao_responder(request, id):
    auth_header = request.META.get('HTTP_AUTHORIZATION', '')
    if auth_header.startswith('Token '):
        token_key = auth_header.split(' ')[1]
        try:
            token = Token.objects.get(key=token_key)
            request.user = token.user
        except Token.DoesNotExist:
            pass

    if not request.user or not request.user.is_authenticated:
        return Response({'sucesso': False, 'mensagem': 'Não autenticado.'}, status=status.HTTP_401_UNAUTHORIZED)

    if hasattr(request.user, 'perfil_medico'):
        return Response({'sucesso': False, 'mensagem': 'Acesso restrito a pacientes.'}, status=status.HTTP_403_FORBIDDEN)

    autorizacao = get_object_or_404(AutorizacaoAcesso, id=id, paciente=request.user)
    acao = (request.data.get('acao') or request.data.get('status') or '').strip().lower()

    if acao in {'aprovar', 'aprovado', 'approve'}:
        autorizacao.status = 'aprovado'
    elif acao in {'negar', 'negado', 'recusar', 'reject'}:
        autorizacao.status = 'negado'
    else:
        return Response({'sucesso': False, 'mensagem': 'Ação inválida.'}, status=status.HTTP_400_BAD_REQUEST)

    autorizacao.save()
    return Response({'sucesso': True, 'mensagem': 'Decisão registrada com sucesso.', 'status': autorizacao.status})


@api_view(['GET'])
@csrf_exempt
def api_pacientes_autorizados(request):
    auth_header = request.META.get('HTTP_AUTHORIZATION', '')
    if auth_header.startswith('Token '):
        token_key = auth_header.split(' ')[1]
        try:
            token = Token.objects.get(key=token_key)
            request.user = token.user
        except Token.DoesNotExist:
            pass

    if not request.user or not request.user.is_authenticated:
        return Response({'sucesso': False, 'mensagem': 'Não autenticado.'}, status=status.HTTP_401_UNAUTHORIZED)

    if not hasattr(request.user, 'perfil_medico'):
        return Response({'sucesso': False, 'mensagem': 'Acesso restrito a médicos.'}, status=status.HTTP_403_FORBIDDEN)

    autorizacoes = AutorizacaoAcesso.objects.filter(medico=request.user, status='aprovado').order_by('-atualizado_em', '-criado_em')
    pacientes = []
    for autorizacao in autorizacoes:
        perfil_paciente = getattr(autorizacao.paciente, 'perfil', None)
        pacientes.append({
            'id': autorizacao.paciente.id,
            'nome': autorizacao.paciente.first_name or autorizacao.paciente.username,
            'cpf': perfil_paciente.cpf if perfil_paciente else '',
            'email': autorizacao.paciente.email,
        })

    return Response({'sucesso': True, 'pacientes': pacientes})


@api_view(['GET', 'POST'])
@csrf_exempt
def api_medicacoes_paciente(request):
    auth_header = request.META.get('HTTP_AUTHORIZATION', '')
    if auth_header.startswith('Token '):
        token_key = auth_header.split(' ')[1]
        try:
            token = Token.objects.get(key=token_key)
            request.user = token.user
        except Token.DoesNotExist:
            pass

    if not request.user or not request.user.is_authenticated:
        return Response({'sucesso': False, 'mensagem': 'Não autenticado.'}, status=status.HTTP_401_UNAUTHORIZED)

    if request.method == 'GET':
        medicamentos = Medicamento.objects.filter(usuario=request.user).order_by('-criado_em')
        taxas = TaxaCorrecao.objects.filter(usuario=request.user).order_by('glicemia_min')

        medicamentos_lista = [
            {
                'id': med.id,
                'nome': med.nome,
                'dose_ui': med.dose_ui,
                'observacao': med.observacao,
                'criado_em': med.criado_em.isoformat(),
            }
            for med in medicamentos
        ]
        taxas_lista = [
            {
                'id': taxa.id,
                'glicemia_min': taxa.glicemia_min,
                'glicemia_max': taxa.glicemia_max,
                'dose_ui': taxa.dose_ui,
                'criado_em': taxa.criado_em.isoformat(),
            }
            for taxa in taxas
        ]
        return Response({'medicamentos': medicamentos_lista, 'taxas': taxas_lista})

    nome = request.data.get('nome')
    dose_ui = request.data.get('dose_ui')
    observacao = request.data.get('observacao', '')

    if not nome:
        return Response({'sucesso': False, 'mensagem': 'Nome da medicação é obrigatório.'}, status=status.HTTP_400_BAD_REQUEST)

    dose_val = None
    if dose_ui is not None and str(dose_ui).strip() != '':
        try:
            dose_val = int(dose_ui)
        except (ValueError, TypeError):
            return Response({'sucesso': False, 'mensagem': 'Dose deve ser um número inteiro.'}, status=status.HTTP_400_BAD_REQUEST)

    Medicamento.objects.create(
        usuario=request.user,
        nome=nome,
        dose_ui=dose_val,
        observacao=observacao,
    )

    return Response({'sucesso': True, 'mensagem': 'Medicação cadastrada com sucesso.'})


@csrf_exempt
@api_view(['DELETE'])
def api_medicacao_paciente_detail(request, id):
    auth_header = request.META.get('HTTP_AUTHORIZATION', '')
    if auth_header.startswith('Token '):
        token_key = auth_header.split(' ')[1]
        try:
            token = Token.objects.get(key=token_key)
            request.user = token.user
        except Token.DoesNotExist:
            pass

    if not request.user or not request.user.is_authenticated:
        return Response({'sucesso': False, 'mensagem': 'Não autenticado.'}, status=status.HTTP_401_UNAUTHORIZED)

    medicamento = get_object_or_404(Medicamento, id=id, usuario=request.user)
    medicamento.delete()
    return Response({'sucesso': True, 'mensagem': 'Medicação excluída com sucesso.'})


@csrf_exempt
@api_view(['GET', 'POST'])
def api_taxas_paciente(request):
    auth_header = request.META.get('HTTP_AUTHORIZATION', '')
    if auth_header.startswith('Token '):
        token_key = auth_header.split(' ')[1]
        try:
            token = Token.objects.get(key=token_key)
            request.user = token.user
        except Token.DoesNotExist:
            pass

    if not request.user or not request.user.is_authenticated:
        return Response({'sucesso': False, 'mensagem': 'Não autenticado.'}, status=status.HTTP_401_UNAUTHORIZED)

    if request.method == 'GET':
        taxas = TaxaCorrecao.objects.filter(usuario=request.user).order_by('glicemia_min')
        taxas_lista = [
            {
                'id': taxa.id,
                'glicemia_min': taxa.glicemia_min,
                'glicemia_max': taxa.glicemia_max,
                'dose_ui': taxa.dose_ui,
                'criado_em': taxa.criado_em.isoformat(),
            }
            for taxa in taxas
        ]
        return Response({'taxas': taxas_lista})

    glicemia_min = request.data.get('glicemia_min')
    glicemia_max = request.data.get('glicemia_max')
    dose_ui = request.data.get('dose_ui')

    if glicemia_min is None or str(glicemia_min).strip() == '':
        return Response({'sucesso': False, 'mensagem': 'Glicemia mínima é obrigatória.'}, status=status.HTTP_400_BAD_REQUEST)
    if dose_ui is None or str(dose_ui).strip() == '':
        return Response({'sucesso': False, 'mensagem': 'Dose de correção é obrigatória.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        glicemia_min_val = int(glicemia_min)
    except (ValueError, TypeError):
        return Response({'sucesso': False, 'mensagem': 'Glicemia mínima deve ser um número inteiro.'}, status=status.HTTP_400_BAD_REQUEST)

    glicemia_max_val = None
    if glicemia_max is not None and str(glicemia_max).strip() != '':
        try:
            glicemia_max_val = int(glicemia_max)
        except (ValueError, TypeError):
            return Response({'sucesso': False, 'mensagem': 'Glicemia máxima deve ser um número inteiro ou vazio.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        dose_val = int(dose_ui)
    except (ValueError, TypeError):
        return Response({'sucesso': False, 'mensagem': 'Dose de correção deve ser um número inteiro.'}, status=status.HTTP_400_BAD_REQUEST)

    TaxaCorrecao.objects.create(
        usuario=request.user,
        glicemia_min=glicemia_min_val,
        glicemia_max=glicemia_max_val,
        dose_ui=dose_val,
    )

    return Response({'sucesso': True, 'mensagem': 'Taxa de correção cadastrada com sucesso.'})


@csrf_exempt
@api_view(['DELETE'])
def api_taxa_paciente_detail(request, id):
    auth_header = request.META.get('HTTP_AUTHORIZATION', '')
    if auth_header.startswith('Token '):
        token_key = auth_header.split(' ')[1]
        try:
            token = Token.objects.get(key=token_key)
            request.user = token.user
        except Token.DoesNotExist:
            pass

    if not request.user or not request.user.is_authenticated:
        return Response({'sucesso': False, 'mensagem': 'Não autenticado.'}, status=status.HTTP_401_UNAUTHORIZED)

    taxa = get_object_or_404(TaxaCorrecao, id=id, usuario=request.user)
    taxa.delete()
    return Response({'sucesso': True, 'mensagem': 'Taxa de correção excluída com sucesso.'})
