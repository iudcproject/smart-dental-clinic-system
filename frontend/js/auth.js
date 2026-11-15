/* ==========================================================================
   Authentication Logic & Anatomical 3D Tooth Dentist Rig (Articulated Arms)
   ========================================================================== */

(function () {
  let avatarController = null;

  document.addEventListener('DOMContentLoaded', async () => {
    await redirectIfAlreadyLoggedIn();
    checkPendingBookingNotice();
    avatarController = init3DToothDentistScene();
    initTabsAndViews();
    bindForms();
  });

  async function redirectIfAlreadyLoggedIn() {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        window.location.href = '/dashboard.html';
      }
    } catch (e) {}
  }

  function checkPendingBookingNotice() {
    try {
      const pending = sessionStorage.getItem('pending_booking');
      const banner = document.getElementById('pending-booking-banner');
      if (pending && banner) {
        banner.hidden = false;
      }
    } catch (e) {}
  }

  // ========================================================================
  // Anatomical 3D Molar Dentist with Attached Arms & Crisp Dental Clinic Scene
  // ========================================================================
  function init3DToothDentistScene() {
    const stage = document.getElementById('login-avatar-stage');
    const canvas = document.getElementById('avatar-3d-canvas');
    const statusBadge = document.getElementById('avatar-status-badge');

    if (!stage || !canvas || typeof window.THREE === 'undefined') {
      return null;
    }

    const THREE = window.THREE;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function setStatus(text, tone) {
      if (!statusBadge) return;
      statusBadge.textContent = text;
      statusBadge.className = 'avatar-status-badge';
      if (tone) {
        statusBadge.classList.add(`is-${tone}`);
      }
    }

    // 1. Scene & Camera Setup (No Heavy Fog so Clinic Background Stays Crisp)
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xdcf5f2);

    const width = stage.clientWidth || 380;
    const height = stage.clientHeight || 232;
    const camera = new THREE.PerspectiveCamera(34, width / height, 0.1, 45);
    camera.position.set(0, 0.06, 5.45);

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(width, height, false);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.06;

    // 2. Crisp Three-Point Clinical Lighting
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x94a3b8, 1.15);
    hemiLight.position.set(0, 6, 3);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.3);
    keyLight.position.set(2.8, 4.2, 5.0);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xe0f2fe, 0.72);
    fillLight.position.set(-3.5, 1.8, 3.2);
    scene.add(fillLight);

    const moodRimLight = new THREE.PointLight(0x14b8a6, 2.2, 8);
    moodRimLight.position.set(-1.6, 1.5, -0.8);
    scene.add(moodRimLight);

    // 3. Physically-Based Materials
    const enamelMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      roughness: 0.14,
      metalness: 0.02,
      clearcoat: 1.0,
      clearcoatRoughness: 0.06
    });

    const coatMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.48,
      metalness: 0.02
    });

    const scrubMat = new THREE.MeshStandardMaterial({
      color: 0x0d9488,
      roughness: 0.46,
      metalness: 0.04
    });

    const gloveMat = new THREE.MeshPhysicalMaterial({
      color: 0x14b8a6,
      roughness: 0.3,
      metalness: 0.04,
      clearcoat: 0.4
    });

    const chromeMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      roughness: 0.15,
      metalness: 0.92
    });

    const darkMetalMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.3,
      metalness: 0.72
    });

    const scleraMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      roughness: 0.12,
      clearcoat: 0.95
    });

    const irisMat = new THREE.MeshStandardMaterial({
      color: 0x0f766e,
      roughness: 0.22
    });

    const pupilMat = new THREE.MeshBasicMaterial({ color: 0x090d16 });
    const catchlightMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

    const browMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.5
    });

    const cheekMat = new THREE.MeshBasicMaterial({
      color: 0xfb7185,
      transparent: true,
      opacity: 0.28
    });

    const lipMat = new THREE.MeshStandardMaterial({
      color: 0xbe123c,
      roughness: 0.4
    });

    const mouthInnerMat = new THREE.MeshBasicMaterial({ color: 0x881337 });

    // ======================================================================
    // 4. High-Clarity 3D Dental Clinic Background
    // ======================================================================
    const clinicGroup = new THREE.Group();
    clinicGroup.position.set(0, 0, -2.35);
    scene.add(clinicGroup);

    // Clinic Tiled Floor & Crisp Mint-White Back Wall
    const floorMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(16, 10),
      new THREE.MeshStandardMaterial({ color: 0xccebe6, roughness: 0.5 })
    );
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.position.set(0, -1.42, 0);
    clinicGroup.add(floorMesh);

    const backWallMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(16, 9),
      new THREE.MeshStandardMaterial({ color: 0xf1fdfa, roughness: 0.75 })
    );
    backWallMesh.position.set(0, 1.5, -2.0);
    clinicGroup.add(backWallMesh);

    // Crisp Teal Lower Wall Paneling & Trim
    const wallBand = new THREE.Mesh(
      new THREE.BoxGeometry(16, 0.92, 0.06),
      new THREE.MeshStandardMaterial({ color: 0x99f6e4, roughness: 0.55 })
    );
    wallBand.position.set(0, -0.96, -1.96);
    clinicGroup.add(wallBand);

    const wallTrim = new THREE.Mesh(
      new THREE.BoxGeometry(16, 0.05, 0.08),
      new THREE.MeshStandardMaterial({ color: 0x0d9488, roughness: 0.4 })
    );
    wallTrim.position.set(0, -0.49, -1.95);
    clinicGroup.add(wallTrim);

    // Clinic Window with Clear Frame & Blinds on Left
    const windowFrame = new THREE.Mesh(
      new THREE.BoxGeometry(2.05, 2.05, 0.1),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.35 })
    );
    windowFrame.position.set(-2.3, 0.85, -1.92);
    clinicGroup.add(windowFrame);

    const windowGlass = new THREE.Mesh(
      new THREE.PlaneGeometry(1.85, 1.85),
      new THREE.MeshBasicMaterial({ color: 0xe0f2fe })
    );
    windowGlass.position.set(-2.3, 0.85, -1.86);
    clinicGroup.add(windowGlass);

    const slatGeo = new THREE.BoxGeometry(1.82, 0.038, 0.02);
    const slatMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 });
    for (let s = -0.72; s <= 0.72; s += 0.24) {
      const slat = new THREE.Mesh(slatGeo, slatMat);
      slat.position.set(-2.3, 0.85 + s, -1.84);
      slat.rotation.x = 0.25;
      clinicGroup.add(slat);
    }

    // Clinic Medical Cabinet & Sterilization Counter on Left
    const cabinetGroup = new THREE.Group();
    cabinetGroup.position.set(-2.15, -0.74, -1.1);
    clinicGroup.add(cabinetGroup);

    const cabinetBody = new THREE.Mesh(
      new THREE.BoxGeometry(1.8, 1.32, 0.72),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 })
    );
    cabinetGroup.add(cabinetBody);

    const counterTop = new THREE.Mesh(
      new THREE.BoxGeometry(1.9, 0.08, 0.8),
      new THREE.MeshStandardMaterial({ color: 0x0d9488, roughness: 0.32 })
    );
    counterTop.position.set(0, 0.68, 0);
    cabinetGroup.add(counterTop);

    for (let d = -0.26; d <= 0.34; d += 0.3) {
      const handle = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.036, 0.05), darkMetalMat);
      handle.position.set(0, d, 0.38);
      cabinetGroup.add(handle);
    }

    // Dental Chair & Overhead Operating Lamp on Right
    const dentalUnitGroup = new THREE.Group();
    dentalUnitGroup.position.set(2.05, -0.74, -0.85);
    dentalUnitGroup.rotation.y = -0.48;
    clinicGroup.add(dentalUnitGroup);

    const chairPedestal = new THREE.Mesh(
      new THREE.CylinderGeometry(0.28, 0.42, 0.44, 24),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.35 })
    );
    chairPedestal.position.set(0, -0.45, 0);
    dentalUnitGroup.add(chairPedestal);

    const chairCushionMat = new THREE.MeshStandardMaterial({ color: 0x0d9488, roughness: 0.42 });
    const chairSeat = new THREE.Mesh(new THREE.BoxGeometry(0.88, 0.18, 1.15), chairCushionMat);
    chairSeat.position.set(0, -0.15, 0.15);
    chairSeat.rotation.x = -0.12;
    dentalUnitGroup.add(chairSeat);

    const chairBack = new THREE.Mesh(new THREE.BoxGeometry(0.82, 1.15, 0.18), chairCushionMat);
    chairBack.position.set(0, 0.45, -0.42);
    chairBack.rotation.x = -0.35;
    dentalUnitGroup.add(chairBack);

    const chairHeadrest = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.28, 0.16), chairCushionMat);
    chairHeadrest.position.set(0, 1.12, -0.64);
    chairHeadrest.rotation.x = -0.2;
    dentalUnitGroup.add(chairHeadrest);

    const lampPole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.35, 14), darkMetalMat);
    lampPole.position.set(-0.62, 0.55, -0.2);
    dentalUnitGroup.add(lampPole);

    const lampArm = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.95, 14), chromeMat);
    lampArm.position.set(-0.25, 1.68, 0.05);
    lampArm.rotation.z = -1.25;
    lampArm.rotation.y = 0.35;
    dentalUnitGroup.add(lampArm);

    const lampHead = new THREE.Mesh(
      new THREE.CylinderGeometry(0.24, 0.18, 0.12, 22),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.28 })
    );
    lampHead.position.set(0.15, 1.52, 0.22);
    lampHead.rotation.x = 0.55;
    dentalUnitGroup.add(lampHead);

    const lampBulb = new THREE.Mesh(
      new THREE.CircleGeometry(0.2, 22),
      new THREE.MeshBasicMaterial({ color: 0xfef08a })
    );
    lampBulb.position.set(0.15, 1.46, 0.26);
    lampBulb.rotation.x = Math.PI / 2 + 0.55;
    dentalUnitGroup.add(lampBulb);

    // ======================================================================
    // 5. Anatomical Sculpted 3D Molar Tooth Dentist Rig
    // ======================================================================
    const toothRootRig = new THREE.Group();
    toothRootRig.position.set(0, -0.05, 0.42);
    scene.add(toothRootRig);

    // 5A. High-Detail Sculpted Anatomical Molar Geometry (4 Crown Cusps + 2 Roots)
    function buildAnatomicalMolarGeometry() {
      const geo = new THREE.SphereGeometry(0.86, 80, 68);
      const pos = geo.attributes.position;

      for (let i = 0; i < pos.count; i++) {
        let x = pos.getX(i);
        let y = pos.getY(i);
        let z = pos.getZ(i);

        const ny = y / 0.86; // -1 (root tips) to +1 (crown cusps)
        const angle = Math.atan2(z, x);

        if (ny >= -0.08) {
          // Crown Section: Rounded molar cross-section with gentle waist near gumline
          const crownT = (ny + 0.08) / 1.08;
          const molarSquare = 1 + 0.15 * Math.pow(Math.sin(angle * 2), 2);
          const waistCurve = 0.92 + 0.16 * Math.sin(crownT * Math.PI * 0.82);

          x *= waistCurve * molarSquare * 1.03;
          z *= waistCurve * molarSquare * 0.78;

          // 4 Anatomical Occlusal Cusps on Top Crown + Central Fossa Groove
          if (ny > 0.45) {
            const topT = (ny - 0.45) / 0.55;
            const smoothTop = topT * topT * (3 - 2 * topT);
            const cuspX = Math.pow(Math.sin(x * 3.3), 2);
            const cuspZ = Math.pow(Math.sin(z * 4.2), 2);
            const centralGroove = Math.exp(-(x * x * 6.5 + z * z * 8.0));
            y += smoothTop * (0.14 * (cuspX * 0.65 + cuspZ * 0.35) - 0.1 * centralGroove);
          }
        } else {
          // Lower Root Bifurcation: Smoothly splits into 2 anatomical molar roots
          const rootT = Math.min(1, Math.abs(ny + 0.08) / 0.92);
          const smoothRoot = rootT * rootT * (3 - 2 * rootT);
          const taper = Math.max(0.16, 1 - Math.pow(rootT, 1.25) * 0.8);

          const sideSign = x >= 0 ? 1 : -1;
          const rootSpread = sideSign * smoothRoot * 0.34;
          const rootTipCurve = -sideSign * Math.pow(Math.max(0, rootT - 0.6) / 0.4, 2) * 0.08;

          x = x * 0.48 * taper + rootSpread + rootTipCurve;
          z = z * 0.62 * taper;
          y = y * 1.1;
        }

        pos.setXYZ(i, x, y, z);
      }

      geo.computeVertexNormals();
      return geo;
    }

    const toothBodyMesh = new THREE.Mesh(buildAnatomicalMolarGeometry(), enamelMat);
    toothRootRig.add(toothBodyMesh);

    // 5B. Tailored Dentist Coat & Scrubs Fitted Cleanly to Tooth Waist
    const outfitGroup = new THREE.Group();
    outfitGroup.position.set(0, -0.22, 0);
    toothRootRig.add(outfitGroup);

    // Inner Teal Medical Scrubs V-Neck Top
    const scrubTorsoGeo = new THREE.CylinderGeometry(0.69, 0.61, 0.52, 40, 1, false);
    scrubTorsoGeo.scale(1.06, 1, 0.78);
    const scrubTorso = new THREE.Mesh(scrubTorsoGeo, scrubMat);
    scrubTorso.position.set(0, 0.02, 0.01);
    outfitGroup.add(scrubTorso);

    // White Lab Coat Torso Shell with Open Front V-Neck
    const coatShellGeo = new THREE.CylinderGeometry(
      0.73,
      0.69,
      0.56,
      44,
      1,
      false,
      0.34,
      Math.PI * 2 - 0.68
    );
    coatShellGeo.scale(1.08, 1, 0.81);
    const coatShell = new THREE.Mesh(coatShellGeo, coatMat);
    coatShell.position.set(0, 0, 0.01);
    outfitGroup.add(coatShell);

    // Tailored Coat Lapels & Collar
    const lapelGeo = new THREE.BoxGeometry(0.14, 0.48, 0.06);
    const leftLapel = new THREE.Mesh(lapelGeo, coatMat);
    leftLapel.position.set(-0.23, 0.04, 0.54);
    leftLapel.rotation.set(-0.1, -0.24, -0.22);
    outfitGroup.add(leftLapel);

    const rightLapel = new THREE.Mesh(lapelGeo, coatMat);
    rightLapel.position.set(0.23, 0.04, 0.54);
    rightLapel.rotation.set(-0.1, 0.24, 0.22);
    outfitGroup.add(rightLapel);

    // Coat Chest Pocket & Silver Pen
    const pocketMesh = new THREE.Mesh(new THREE.BoxGeometry(0.19, 0.17, 0.035), coatMat);
    pocketMesh.position.set(0.41, -0.06, 0.48);
    pocketMesh.rotation.y = 0.42;
    outfitGroup.add(pocketMesh);

    const penClip = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.13, 10), chromeMat);
    penClip.position.set(0.44, 0.04, 0.49);
    penClip.rotation.z = -0.12;
    outfitGroup.add(penClip);

    // 3D Stethoscope Around Neck
    const stethoCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.34, 0.31, 0.34),
      new THREE.Vector3(-0.37, 0.1, 0.55),
      new THREE.Vector3(-0.19, -0.08, 0.6),
      new THREE.Vector3(0.19, -0.08, 0.6),
      new THREE.Vector3(0.37, 0.1, 0.55),
      new THREE.Vector3(0.34, 0.31, 0.34)
    ]);
    const stethoTube = new THREE.Mesh(
      new THREE.TubeGeometry(stethoCurve, 32, 0.022, 12, false),
      darkMetalMat
    );
    outfitGroup.add(stethoTube);

    const chestpieceGroup = new THREE.Group();
    chestpieceGroup.position.set(0.26, -0.05, 0.59);
    const chestDisc = new THREE.Mesh(new THREE.CylinderGeometry(0.068, 0.068, 0.028, 20), chromeMat);
    chestDisc.rotation.x = Math.PI / 2;
    const chestCenter = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.034, 16), scrubMat);
    chestCenter.rotation.x = Math.PI / 2;
    chestpieceGroup.add(chestDisc, chestCenter);
    outfitGroup.add(chestpieceGroup);

    // 5C. Dentist Head-Mirror Reflector Band on Upper Crown
    const headMirrorGroup = new THREE.Group();
    headMirrorGroup.position.set(0, 0.72, 0.04);
    toothRootRig.add(headMirrorGroup);

    const bandGeo = new THREE.TorusGeometry(0.68, 0.02, 12, 44);
    bandGeo.rotateX(Math.PI / 2 + 0.16);
    bandGeo.scale(1.06, 1, 0.84);
    const headBand = new THREE.Mesh(bandGeo, darkMetalMat);
    headMirrorGroup.add(headBand);

    const reflectorHolder = new THREE.Group();
    reflectorHolder.position.set(-0.26, 0.1, 0.56);
    reflectorHolder.rotation.set(-0.2, -0.28, 0.18);
    headMirrorGroup.add(reflectorHolder);

    const mirrorDisc = new THREE.Mesh(
      new THREE.TorusGeometry(0.14, 0.052, 16, 32),
      chromeMat
    );
    mirrorDisc.scale.set(1, 1, 0.35);
    reflectorHolder.add(mirrorDisc);

    const mirrorHole = new THREE.Mesh(
      new THREE.CircleGeometry(0.04, 20),
      darkMetalMat
    );
    mirrorHole.position.z = 0.015;
    reflectorHolder.add(mirrorHole);

    // 5D. Expressive 3D Face on Tooth Crown
    const faceGroup = new THREE.Group();
    faceGroup.position.set(0, 0.34, 0.59);
    toothRootRig.add(faceGroup);

    function createToothEye(xPos) {
      const socket = new THREE.Group();
      socket.position.set(xPos, 0.08, 0.04);

      const eyeball = new THREE.Group();
      socket.add(eyeball);

      const sclera = new THREE.Mesh(new THREE.SphereGeometry(0.132, 28, 28), scleraMat);
      eyeball.add(sclera);

      const iris = new THREE.Mesh(new THREE.SphereGeometry(0.074, 24, 24), irisMat);
      iris.position.set(0, 0, 0.104);
      iris.scale.set(1, 1, 0.45);
      eyeball.add(iris);

      const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.039, 20, 20), pupilMat);
      pupil.position.set(0, 0, 0.128);
      pupil.scale.set(1, 1, 0.4);
      eyeball.add(pupil);

      const catchlight = new THREE.Mesh(new THREE.SphereGeometry(0.017, 12, 12), catchlightMat);
      catchlight.position.set(0.025, 0.028, 0.136);
      eyeball.add(catchlight);

      const upperLid = new THREE.Mesh(
        new THREE.SphereGeometry(0.142, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.52),
        enamelMat
      );
      upperLid.rotation.x = -1.25;
      socket.add(upperLid);

      const lowerLid = new THREE.Mesh(
        new THREE.SphereGeometry(0.141, 24, 16, 0, Math.PI * 2, Math.PI * 0.48, Math.PI * 0.52),
        enamelMat
      );
      lowerLid.rotation.x = 1.25;
      socket.add(lowerLid);

      faceGroup.add(socket);
      return { socket, eyeball, upperLid, lowerLid };
    }

    const leftEye = createToothEye(-0.23);
    const rightEye = createToothEye(0.23);

    const browGeo = new THREE.CapsuleGeometry(0.023, 0.16, 10, 16);
    browGeo.rotateZ(Math.PI / 2);

    const leftBrow = new THREE.Mesh(browGeo, browMat);
    leftBrow.position.set(-0.23, 0.25, 0.09);
    faceGroup.add(leftBrow);

    const rightBrow = new THREE.Mesh(browGeo, browMat);
    rightBrow.position.set(0.23, 0.25, 0.09);
    faceGroup.add(rightBrow);

    const cheekGeo = new THREE.SphereGeometry(0.09, 18, 18);
    cheekGeo.scale(1.25, 0.72, 0.4);
    const leftCheek = new THREE.Mesh(cheekGeo, cheekMat);
    leftCheek.position.set(-0.35, -0.05, 0.06);
    const rightCheek = new THREE.Mesh(cheekGeo, cheekMat);
    rightCheek.position.set(0.35, -0.05, 0.06);
    faceGroup.add(leftCheek, rightCheek);

    const mouthAnchor = new THREE.Group();
    mouthAnchor.position.set(0, -0.14, 0.11);
    faceGroup.add(mouthAnchor);

    let mouthMesh = null;
    function rebuildMouthCurve(curveAmount) {
      if (mouthMesh) {
        mouthAnchor.remove(mouthMesh);
        mouthMesh.geometry.dispose();
      }
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-0.13, curveAmount * 0.42, -0.02),
        new THREE.Vector3(-0.065, -curveAmount * 0.55, 0.02),
        new THREE.Vector3(0, -curveAmount * 0.72, 0.03),
        new THREE.Vector3(0.065, -curveAmount * 0.55, 0.02),
        new THREE.Vector3(0.13, curveAmount * 0.42, -0.02)
      ]);
      mouthMesh = new THREE.Mesh(
        new THREE.TubeGeometry(curve, 20, 0.019, 10, false),
        lipMat
      );
      mouthAnchor.add(mouthMesh);
    }
    rebuildMouthCurve(0.075);

    const gaspMouth = new THREE.Mesh(new THREE.SphereGeometry(0.065, 20, 20), mouthInnerMat);
    gaspMouth.scale.set(0.85, 1.15, 0.45);
    gaspMouth.visible = false;
    mouthAnchor.add(gaspMouth);

    // ======================================================================
    // 5E. Full Articulated Arms Attached to Shoulders (No Floating Hands!)
    //     Shoulder Pivot -> Upper Coat Sleeve -> Elbow Joint -> Forearm -> Gloved Hand
    // ======================================================================
    function createAttachedArmRig(isLeft, withDentalMirror) {
      const side = isLeft ? -1 : 1;

      // 1. Shoulder Pivot Mounted Directly into Side of Doctor Coat
      const shoulderPivot = new THREE.Group();
      shoulderPivot.position.set(side * 0.74, -0.06, 0.06);
      toothRootRig.add(shoulderPivot);

      // Rounded Shoulder Cap Seam
      const shoulderCap = new THREE.Mesh(new THREE.SphereGeometry(0.135, 20, 20), coatMat);
      shoulderPivot.add(shoulderCap);

      // Upper Arm Coat Sleeve (Extends downward along -Y from Shoulder)
      const upperArmMesh = new THREE.Mesh(
        new THREE.CylinderGeometry(0.115, 0.105, 0.34, 20),
        coatMat
      );
      upperArmMesh.position.set(0, -0.17, 0);
      shoulderPivot.add(upperArmMesh);

      // 2. Elbow Pivot at Bottom of Upper Arm
      const elbowPivot = new THREE.Group();
      elbowPivot.position.set(0, -0.34, 0);
      shoulderPivot.add(elbowPivot);

      const elbowJoint = new THREE.Mesh(new THREE.SphereGeometry(0.102, 18, 18), coatMat);
      elbowPivot.add(elbowJoint);

      // Forearm Coat Sleeve (Extends forward/downward from Elbow)
      const forearmMesh = new THREE.Mesh(
        new THREE.CylinderGeometry(0.098, 0.088, 0.3, 20),
        coatMat
      );
      forearmMesh.position.set(0, -0.15, 0);
      elbowPivot.add(forearmMesh);

      // White Coat Sleeve Cuff Ring
      const cuffRing = new THREE.Mesh(
        new THREE.TorusGeometry(0.09, 0.018, 12, 24),
        coatMat
      );
      cuffRing.rotation.x = Math.PI / 2;
      cuffRing.position.set(0, -0.29, 0);
      elbowPivot.add(cuffRing);

      // 3. Wrist & Teal Nitrile Gloved Hand Attached to Forearm Cuff
      const handGroup = new THREE.Group();
      handGroup.position.set(0, -0.36, 0.02);
      // Orient hand so fingers extend naturally outward from the sleeve
      handGroup.rotation.set(Math.PI, 0, 0);
      elbowPivot.add(handGroup);

      const palm = new THREE.Mesh(new THREE.CapsuleGeometry(0.088, 0.085, 12, 20), gloveMat);
      palm.scale.set(1.05, 1.0, 0.56);
      handGroup.add(palm);

      const fingerOffsets = [-0.062, -0.021, 0.021, 0.062];
      const fingerLengths = [0.1, 0.125, 0.115, 0.092];
      fingerOffsets.forEach((fx, idx) => {
        const finger = new THREE.Mesh(
          new THREE.CapsuleGeometry(0.019, fingerLengths[idx], 8, 14),
          gloveMat
        );
        finger.position.set(fx, 0.1 + fingerLengths[idx] * 0.35, 0.01);
        finger.rotation.x = 0.22;
        handGroup.add(finger);
      });

      const thumb = new THREE.Mesh(new THREE.CapsuleGeometry(0.021, 0.08, 8, 14), gloveMat);
      thumb.position.set(-side * 0.095, 0.02, 0.025);
      thumb.rotation.z = side * 0.65;
      handGroup.add(thumb);

      // Miniature Stainless-Steel Dental Mirror Held in Right Gloved Hand
      if (withDentalMirror) {
        const mirrorTool = new THREE.Group();
        mirrorTool.position.set(0.08, 0.12, 0.05);
        mirrorTool.rotation.set(0.18, -0.15, -0.35);

        const handleRod = new THREE.Mesh(
          new THREE.CylinderGeometry(0.012, 0.014, 0.4, 12),
          chromeMat
        );
        mirrorTool.add(handleRod);

        const mirrorHeadRim = new THREE.Mesh(
          new THREE.TorusGeometry(0.068, 0.011, 12, 24),
          chromeMat
        );
        mirrorHeadRim.position.set(0, 0.23, 0.02);
        mirrorHeadRim.rotation.x = -0.35;
        mirrorTool.add(mirrorHeadRim);

        const mirrorGlass = new THREE.Mesh(
          new THREE.CircleGeometry(0.063, 20),
          new THREE.MeshBasicMaterial({ color: 0xe0f2fe })
        );
        mirrorGlass.position.set(0, 0.23, 0.025);
        mirrorGlass.rotation.x = -0.35;
        mirrorTool.add(mirrorGlass);

        handGroup.add(mirrorTool);
      }

      return { shoulderPivot, elbowPivot, handGroup };
    }

    const leftArm = createAttachedArmRig(true, false);
    const rightArm = createAttachedArmRig(false, true);

    // ======================================================================
    // 6. Real-Time Interactive State Machine & Joint Kinematics
    // ======================================================================
    const state = {
      targetMouseX: 0,
      targetMouseY: 0,
      currentMouseX: 0,
      currentMouseY: 0,

      targetYaw: 0,
      targetPitch: 0,
      targetRoll: 0,
      targetPosZ: 0.42,
      currentYaw: 0,
      currentPitch: 0,
      currentRoll: 0,
      currentPosZ: 0.42,

      targetBrowY: 0.25,
      targetLeftBrowRot: 0.04,
      targetRightBrowRot: -0.04,
      targetUpperLid: -1.25,
      targetLowerLid: 1.25,
      currentBrowY: 0.25,
      currentLeftBrowRot: 0.04,
      currentRightBrowRot: -0.04,
      currentUpperLid: -1.25,
      currentLowerLid: 1.25,

      mouthCurve: 0.075,
      lastMouthCurve: 0.075,
      isGasping: false,
      targetCheekOpacity: 0.28,

      // Joint Euler Angles for Attached Left & Right Arms
      // Resting pose: arms hang gently from shoulders with elbows slightly bent forward
      targetLeftShoulder: new THREE.Euler(-0.28, 0.15, -0.32),
      targetLeftElbow: new THREE.Euler(-0.65, 0.2, 0.28),
      targetRightShoulder: new THREE.Euler(-0.38, -0.18, 0.34),
      targetRightElbow: new THREE.Euler(-0.88, -0.22, -0.25),

      targetRimColor: new THREE.Color(0x14b8a6),

      isInputFocused: false,
      isCoveringEyes: false,
      isPeekingEyes: false,
      emotionTimer: null,
      pokeCount: 0,
      saccadeX: 0,
      saccadeY: 0,
      isBlinking: false,
      shakePhase: 0
    };

    const eyeLookTarget = new THREE.Vector3(0, 0.35, 4.4);

    function setRestingArmsPose() {
      state.targetLeftShoulder.set(-0.28, 0.15, -0.32);
      state.targetLeftElbow.set(-0.65, 0.2, 0.28);
      state.targetRightShoulder.set(-0.38, -0.18, 0.34);
      state.targetRightElbow.set(-0.88, -0.22, -0.25);
    }

    function applyEmotion(emotion, durationMs = 1750) {
      if (state.isCoveringEyes || state.isPeekingEyes) return;

      clearTimeout(state.emotionTimer);
      stage.classList.remove('mood-error', 'mood-success');
      state.shakePhase = 0;

      if (emotion === 'surprise') {
        state.targetPosZ = 0.16;
        state.targetPitch = -0.14;
        state.targetRoll = 0.08;
        state.targetBrowY = 0.33;
        state.targetLeftBrowRot = 0.2;
        state.targetRightBrowRot = -0.2;
        state.targetUpperLid = -1.52;
        state.targetLowerLid = 1.48;
        state.isGasping = true;
        state.targetCheekOpacity = 0.5;
        state.targetRimColor.setHex(0xf59e0b);
        // Both attached arms raise outward in surprise
        state.targetLeftShoulder.set(-0.75, 0.25, -0.82);
        state.targetLeftElbow.set(-1.1, 0.25, 0.35);
        state.targetRightShoulder.set(-0.75, -0.25, 0.82);
        state.targetRightElbow.set(-1.1, -0.25, -0.35);
        setStatus('مفاجأة!', 'warning');
      } else if (emotion === 'curious') {
        state.targetPosZ = 0.56;
        state.targetPitch = 0.06;
        state.targetRoll = -0.22;
        state.targetBrowY = 0.29;
        state.targetLeftBrowRot = 0.25;
        state.targetRightBrowRot = 0.12;
        state.targetUpperLid = -1.12;
        state.targetLowerLid = 1.12;
        state.isGasping = false;
        state.mouthCurve = 0.02;
        state.targetCheekOpacity = 0.26;
        state.targetRimColor.setHex(0x0d9488);
        // Right arm raises mirror slightly in thought
        state.targetLeftShoulder.set(-0.25, 0.15, -0.28);
        state.targetLeftElbow.set(-0.6, 0.2, 0.25);
        state.targetRightShoulder.set(-0.85, -0.3, 0.38);
        state.targetRightElbow.set(-1.35, -0.35, -0.4);
        setStatus('مستغرب وفضولي...', '');
      } else if (emotion === 'sad') {
        state.targetPosZ = 0.32;
        state.targetPitch = 0.2;
        state.targetRoll = 0.14;
        state.targetBrowY = 0.21;
        state.targetLeftBrowRot = -0.28;
        state.targetRightBrowRot = 0.28;
        state.targetUpperLid = -0.96;
        state.targetLowerLid = 1.05;
        state.isGasping = false;
        state.mouthCurve = -0.085;
        state.targetCheekOpacity = 0.18;
        state.targetRimColor.setHex(0x3b82f6);
        // Shoulders droop downward sadly
        state.targetLeftShoulder.set(-0.12, 0.1, -0.18);
        state.targetLeftElbow.set(-0.4, 0.12, 0.18);
        state.targetRightShoulder.set(-0.14, -0.1, 0.18);
        state.targetRightElbow.set(-0.45, -0.12, -0.18);
        setStatus('حزين لأنك نقرت عليه', '');
      } else if (emotion === 'angry') {
        stage.classList.add('mood-error');
        state.targetPosZ = 0.62;
        state.targetPitch = 0.15;
        state.targetRoll = 0;
        state.targetBrowY = 0.18;
        state.targetLeftBrowRot = 0.42;
        state.targetRightBrowRot = -0.42;
        state.targetUpperLid = -0.84;
        state.targetLowerLid = 0.88;
        state.isGasping = false;
        state.mouthCurve = -0.1;
        state.targetCheekOpacity = 0.65;
        state.targetRimColor.setHex(0xef4444);
        state.shakePhase = 1.0;
        // Firm arms-akimbo stance
        state.targetLeftShoulder.set(-0.2, 0.35, -0.62);
        state.targetLeftElbow.set(-0.45, 0.4, 0.72);
        state.targetRightShoulder.set(-0.2, -0.35, 0.62);
        state.targetRightElbow.set(-0.45, -0.4, -0.72);
        setStatus('غاضب! توقف عن النقر المتكرر', 'error');
      } else if (emotion === 'happy' || emotion === 'success') {
        if (emotion === 'success') stage.classList.add('mood-success');
        state.targetPosZ = 0.5;
        state.targetPitch = -0.04;
        state.targetRoll = -0.08;
        state.targetBrowY = 0.29;
        state.targetLeftBrowRot = 0.1;
        state.targetRightBrowRot = -0.1;
        state.targetUpperLid = -1.25;
        state.targetLowerLid = 1.06;
        state.isGasping = false;
        state.mouthCurve = 0.135;
        state.targetCheekOpacity = 0.62;
        state.targetRimColor.setHex(0x10b981);
        state.targetLeftShoulder.set(-0.55, 0.2, -0.68);
        state.targetLeftElbow.set(-0.95, 0.2, 0.3);
        state.targetRightShoulder.set(-0.55, -0.2, 0.68);
        state.targetRightElbow.set(-0.95, -0.2, -0.3);
        setStatus(emotion === 'success' ? 'أهلاً بك في عيادتنا' : 'سعيد بتفاعلك!', 'success');
      } else {
        state.targetPosZ = 0.42;
        state.targetPitch = 0;
        state.targetRoll = 0;
        state.targetBrowY = 0.25;
        state.targetLeftBrowRot = 0.04;
        state.targetRightBrowRot = -0.04;
        state.targetUpperLid = -1.25;
        state.targetLowerLid = 1.25;
        state.isGasping = false;
        state.mouthCurve = 0.075;
        state.targetCheekOpacity = 0.28;
        state.targetRimColor.setHex(0x14b8a6);
        setRestingArmsPose();
        if (!state.isInputFocused) {
          setStatus('يتابع حركتك داخل العيادة', '');
        }
      }

      if (emotion !== 'neutral' && durationMs > 0) {
        state.emotionTimer = setTimeout(() => {
          applyEmotion('neutral', 0);
        }, durationMs);
      }
    }

    function setPrivacyHandsMode(mode) {
      clearTimeout(state.emotionTimer);
      state.isGasping = false;

      if (mode === 'cover') {
        state.isCoveringEyes = true;
        state.isPeekingEyes = false;
        state.targetPosZ = 0.35;
        state.targetYaw = 0;
        state.targetPitch = 0.04;
        state.targetRoll = 0;
        state.targetBrowY = 0.25;
        state.targetLeftBrowRot = 0.04;
        state.targetRightBrowRot = -0.04;
        state.mouthCurve = 0.045;
        state.targetRimColor.setHex(0x0d9488);

        // Both shoulders lift forward & elbows bend inward so gloved hands cover the eyes naturally
        state.targetLeftShoulder.set(-1.38, -0.45, -0.48);
        state.targetLeftElbow.set(-1.15, -0.28, 0.55);
        state.targetRightShoulder.set(-1.38, 0.45, 0.48);
        state.targetRightElbow.set(-1.15, 0.28, -0.55);
        setStatus('خصوصيتك محمية بالكامل', 'private');
      } else if (mode === 'peek') {
        state.isCoveringEyes = false;
        state.isPeekingEyes = true;
        state.targetPosZ = 0.46;
        state.targetYaw = -0.15;
        state.targetPitch = 0.12;
        state.targetRoll = 0.09;
        state.targetBrowY = 0.3;
        state.targetLeftBrowRot = 0.2;
        state.targetRightBrowRot = -0.04;
        state.mouthCurve = 0.025;
        state.targetRimColor.setHex(0xf59e0b);

        // Left arm lowers slightly while right arm stays over right eye
        state.targetLeftShoulder.set(-0.72, -0.1, -0.42);
        state.targetLeftElbow.set(-0.95, 0.15, 0.32);
        state.targetRightShoulder.set(-1.38, 0.45, 0.48);
        state.targetRightElbow.set(-1.15, 0.28, -0.55);
        setStatus('يختلس النظر لكلمة المرور', 'warning');
      } else {
        state.isCoveringEyes = false;
        state.isPeekingEyes = false;
        applyEmotion('neutral', 0);
      }
    }

    // Continuous Real-Time Mouse & Pointer Tracking Across Entire Screen
    function handlePointerMove(clientX, clientY) {
      const rect = stage.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const normX = Math.max(-1, Math.min(1, (clientX - centerX) / (window.innerWidth * 0.42)));
      const normY = Math.max(-1, Math.min(1, (clientY - centerY) / (window.innerHeight * 0.42)));

      state.targetMouseX = normX;
      state.targetMouseY = normY;
    }

    window.addEventListener('pointermove', (e) => {
      handlePointerMove(e.clientX, e.clientY);
    }, { passive: true });

    // Global Screen Click Reaction
    window.addEventListener('pointerdown', (e) => {
      if (stage.contains(e.target) || state.isCoveringEyes || state.isPeekingEyes) return;
      handlePointerMove(e.clientX, e.clientY);
      if (!state.isInputFocused) {
        applyEmotion('surprise', 950);
      }
    });

    // Direct Click / Poke on 3D Tooth Dentist
    const POKE_EMOTIONS = ['surprise', 'curious', 'sad', 'angry', 'happy'];

    function handleCharacterPoke() {
      if (state.isCoveringEyes || state.isPeekingEyes) return;
      const emotion = POKE_EMOTIONS[state.pokeCount % POKE_EMOTIONS.length];
      state.pokeCount += 1;
      applyEmotion(emotion, 2100);
    }

    stage.addEventListener('click', handleCharacterPoke);
    stage.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleCharacterPoke();
      }
    });

    // Organic Blinking & Micro-Saccades
    setInterval(() => {
      if (prefersReducedMotion || document.hidden || state.isCoveringEyes) return;
      state.isBlinking = true;
      setTimeout(() => {
        state.isBlinking = false;
      }, 115);
    }, 3200);

    setInterval(() => {
      if (prefersReducedMotion || document.hidden || state.isInputFocused) {
        state.saccadeX = 0;
        state.saccadeY = 0;
        return;
      }
      state.saccadeX = (Math.random() - 0.5) * 0.16;
      state.saccadeY = (Math.random() - 0.5) * 0.12;
      setTimeout(() => {
        state.saccadeX = 0;
        state.saccadeY = 0;
      }, 380);
    }, 1900);

    window.addEventListener('resize', () => {
      const w = stage.clientWidth;
      const h = stage.clientHeight;
      if (w > 0 && h > 0) {
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h, false);
      }
    });

    // 60/120fps 3D Render & Joint Kinematics Loop
    const clock = new THREE.Clock();

    function animate() {
      requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();
      const lerpSpeed = prefersReducedMotion ? 1 : 0.12;

      // 1. Living Breathing & Subtle Arm Idle Sway
      let idleArmSway = 0;
      if (!prefersReducedMotion) {
        const breath = Math.sin(elapsed * 2.2);
        idleArmSway = Math.sin(elapsed * 1.8) * 0.04;
        toothRootRig.position.y = -0.05 + Math.sin(elapsed * 1.6) * 0.022;
        toothBodyMesh.scale.set(1 + breath * 0.011, 1 + breath * 0.015, 1 + breath * 0.011);
        outfitGroup.scale.set(1 + breath * 0.014, 1 + breath * 0.017, 1 + breath * 0.014);
        chestpieceGroup.rotation.z = Math.sin(elapsed * 1.9) * 0.06;
      }

      // 2. Smooth Pointer Interpolation
      state.currentMouseX += (state.targetMouseX - state.currentMouseX) * lerpSpeed;
      state.currentMouseY += (state.targetMouseY - state.currentMouseY) * lerpSpeed;

      // Crisp Clinic Parallax Behind Character
      clinicGroup.position.x = -state.currentMouseX * 0.2;
      clinicGroup.position.y = state.currentMouseY * 0.12;

      // 3. Tooth 3D Body Rotation
      let desiredYaw = state.currentMouseX * 0.44;
      let desiredPitch = state.currentMouseY * 0.3 + state.targetPitch;
      let desiredRoll = -state.currentMouseX * 0.09 + state.targetRoll;

      if (state.isCoveringEyes) {
        desiredYaw = 0;
        desiredPitch = 0.04;
        desiredRoll = 0;
      } else if (state.isPeekingEyes) {
        desiredYaw = -0.16;
        desiredPitch = 0.12;
        desiredRoll = 0.09;
      }

      if (state.shakePhase > 0.01) {
        desiredYaw += Math.sin(elapsed * 34) * 0.22 * state.shakePhase;
        state.shakePhase *= 0.93;
      }

      state.currentYaw += (desiredYaw - state.currentYaw) * lerpSpeed;
      state.currentPitch += (desiredPitch - state.currentPitch) * lerpSpeed;
      state.currentRoll += (desiredRoll - state.currentRoll) * lerpSpeed;
      state.currentPosZ += (state.targetPosZ - state.currentPosZ) * lerpSpeed;

      toothRootRig.rotation.set(state.currentPitch, state.currentYaw, state.currentRoll);
      toothRootRig.position.z = state.currentPosZ;

      // 4. 3D Eyeball Gaze Tracking in World Space
      const lookX = (state.currentMouseX + state.saccadeX) * 2.15;
      const lookY = 0.35 - (state.currentMouseY + state.saccadeY) * 1.65;
      eyeLookTarget.set(lookX, lookY, 4.1);

      leftEye.eyeball.lookAt(eyeLookTarget);
      rightEye.eyeball.lookAt(eyeLookTarget);

      // 5. Eyelids & Eyebrows Interpolation
      const effectiveUpperLid = state.isBlinking ? -0.05 : state.targetUpperLid;
      const effectiveLowerLid = state.isBlinking ? 0.05 : state.targetLowerLid;

      state.currentUpperLid += (effectiveUpperLid - state.currentUpperLid) * 0.28;
      state.currentLowerLid += (effectiveLowerLid - state.currentLowerLid) * 0.28;
      leftEye.upperLid.rotation.x = state.currentUpperLid;
      rightEye.upperLid.rotation.x = state.currentUpperLid;
      leftEye.lowerLid.rotation.x = state.currentLowerLid;
      rightEye.lowerLid.rotation.x = state.currentLowerLid;

      state.currentBrowY += (state.targetBrowY - state.currentBrowY) * 0.16;
      state.currentLeftBrowRot += (state.targetLeftBrowRot - state.currentLeftBrowRot) * 0.16;
      state.currentRightBrowRot += (state.targetRightBrowRot - state.currentRightBrowRot) * 0.16;

      leftBrow.position.y = state.currentBrowY;
      rightBrow.position.y = state.currentBrowY;
      leftBrow.rotation.z = state.currentLeftBrowRot;
      rightBrow.rotation.z = state.currentRightBrowRot;

      // 6. Mouth & Cheeks Interpolation
      cheekMat.opacity += (state.targetCheekOpacity - cheekMat.opacity) * 0.12;
      if (state.isGasping) {
        if (mouthMesh) mouthMesh.visible = false;
        gaspMouth.visible = true;
      } else {
        gaspMouth.visible = false;
        if (mouthMesh) mouthMesh.visible = true;
        if (Math.abs(state.mouthCurve - state.lastMouthCurve) > 0.004) {
          rebuildMouthCurve(state.mouthCurve);
          state.lastMouthCurve = state.mouthCurve;
        }
      }

      // 7. Attached Shoulder & Elbow Joint Interpolation
      const armLerp = 0.15;
      leftArm.shoulderPivot.rotation.x += (state.targetLeftShoulder.x - leftArm.shoulderPivot.rotation.x) * armLerp;
      leftArm.shoulderPivot.rotation.y += (state.targetLeftShoulder.y - leftArm.shoulderPivot.rotation.y) * armLerp;
      leftArm.shoulderPivot.rotation.z += ((state.targetLeftShoulder.z - idleArmSway) - leftArm.shoulderPivot.rotation.z) * armLerp;

      leftArm.elbowPivot.rotation.x += (state.targetLeftElbow.x - leftArm.elbowPivot.rotation.x) * armLerp;
      leftArm.elbowPivot.rotation.y += (state.targetLeftElbow.y - leftArm.elbowPivot.rotation.y) * armLerp;
      leftArm.elbowPivot.rotation.z += (state.targetLeftElbow.z - leftArm.elbowPivot.rotation.z) * armLerp;

      rightArm.shoulderPivot.rotation.x += (state.targetRightShoulder.x - rightArm.shoulderPivot.rotation.x) * armLerp;
      rightArm.shoulderPivot.rotation.y += (state.targetRightShoulder.y - rightArm.shoulderPivot.rotation.y) * armLerp;
      rightArm.shoulderPivot.rotation.z += ((state.targetRightShoulder.z + idleArmSway) - rightArm.shoulderPivot.rotation.z) * armLerp;

      rightArm.elbowPivot.rotation.x += (state.targetRightElbow.x - rightArm.elbowPivot.rotation.x) * armLerp;
      rightArm.elbowPivot.rotation.y += (state.targetRightElbow.y - rightArm.elbowPivot.rotation.y) * armLerp;
      rightArm.elbowPivot.rotation.z += (state.targetRightElbow.z - rightArm.elbowPivot.rotation.z) * armLerp;

      // 8. Mood Rim Light Color Transition
      moodRimLight.color.lerp(state.targetRimColor, 0.1);

      renderer.render(scene, camera);
    }

    animate();

    // ======================================================================
    // Bind Form Inputs to 3D Tooth Dentist
    // ======================================================================
    function updateGazeFromInput(inputEl) {
      const val = inputEl.value || '';
      const len = Math.min(val.length, 30);
      const progress = len / 30;
      const isLtr = inputEl.getAttribute('dir') === 'ltr' || inputEl.type === 'email' || inputEl.type === 'tel';

      const sweepX = isLtr ? (progress - 0.5) * 1.15 : (0.5 - progress) * 1.15;
      state.targetMouseX = Math.max(-0.85, Math.min(0.85, sweepX));
      state.targetMouseY = 0.62;

      if (inputEl.type === 'email' && val.includes('@') && val.includes('.')) {
        state.mouthCurve = 0.125;
        state.targetCheekOpacity = 0.5;
        state.targetRimColor.setHex(0x10b981);
        setStatus('بريد إلكتروني مكتمل', 'success');
      } else if (len > 2) {
        state.mouthCurve = 0.055;
        setStatus('جاري القراءة والمتابعة...', '');
      } else {
        state.mouthCurve = 0.075;
        setStatus('في انتظار بياناتك', '');
      }
    }

    document.querySelectorAll('.track-gaze').forEach(input => {
      input.addEventListener('focus', () => {
        state.isInputFocused = true;
        setPrivacyHandsMode('none');
        updateGazeFromInput(input);
      });
      input.addEventListener('input', () => updateGazeFromInput(input));
      input.addEventListener('blur', () => {
        state.isInputFocused = false;
        state.targetMouseX = 0;
        state.targetMouseY = 0;
        applyEmotion('neutral', 0);
      });
    });

    document.querySelectorAll('.privacy-secret').forEach(pwInput => {
      pwInput.addEventListener('focus', () => {
        state.isInputFocused = true;
        if (pwInput.type === 'text') {
          setPrivacyHandsMode('peek');
        } else {
          setPrivacyHandsMode('cover');
        }
      });

      pwInput.addEventListener('input', () => {
        if (pwInput.value.length >= 8) {
          setStatus('كلمة مرور قوية ومحمية', 'success');
        } else {
          setStatus(state.isPeekingEyes ? 'يختلس النظر لكلمة المرور' : 'خصوصيتك محمية بالكامل', 'private');
        }
      });

      pwInput.addEventListener('blur', (e) => {
        if (e.relatedTarget && e.relatedTarget.classList.contains('password-toggle-btn')) {
          return;
        }
        state.isInputFocused = false;
        setPrivacyHandsMode('none');
      });
    });

    document.querySelectorAll('.password-toggle-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetId = btn.dataset.target;
        const input = document.getElementById(targetId);
        if (!input) return;

        const revealing = input.type === 'password';
        input.type = revealing ? 'text' : 'password';
        setPrivacyHandsMode(revealing ? 'peek' : 'cover');
        input.focus();
      });
    });

    return {
      reactError(message) {
        state.isCoveringEyes = false;
        state.isPeekingEyes = false;
        applyEmotion('sad', 2200);
        state.shakePhase = 0.85;
        if (message) setStatus(message, 'error');
      },
      reactSuccess(message) {
        state.isCoveringEyes = false;
        state.isPeekingEyes = false;
        applyEmotion('success', 2400);
        if (message) setStatus(message, 'success');
      },
      resetMood() {
        setPrivacyHandsMode('none');
      }
    };
  }

  function initTabsAndViews() {
    const tabLogin = document.getElementById('tab-login');
    const tabRegister = document.getElementById('tab-register');
    const panelLogin = document.getElementById('panel-login');
    const panelRegister = document.getElementById('panel-register');
    const panelForgot = document.getElementById('panel-forgot');
    const panelReset = document.getElementById('panel-reset');
    const subtitle = document.getElementById('auth-subtitle');
    const tabsBar = document.querySelector('.auth-tabs');

    function showPanel(mode) {
      panelLogin.hidden = mode !== 'login';
      panelRegister.hidden = mode !== 'register';
      panelForgot.hidden = mode !== 'forgot';
      panelReset.hidden = mode !== 'reset';

      tabLogin.setAttribute('aria-selected', mode === 'login' ? 'true' : 'false');
      tabRegister.setAttribute('aria-selected', mode === 'register' ? 'true' : 'false');
      tabsBar.style.display = mode === 'forgot' || mode === 'reset' ? 'none' : 'grid';

      avatarController?.resetMood();

      if (mode === 'login') {
        subtitle.textContent = 'سجل الدخول لمتابعة مواعيدك وسجلك العلاجي';
      } else if (mode === 'register') {
        subtitle.textContent = 'أنشئ حساب مريض جديد لحجز المواعيد إلكترونياً';
      } else if (mode === 'forgot') {
        subtitle.textContent = 'أدخل بريدك الإلكتروني لإرسال رابط إعادة تعيين كلمة المرور';
      } else if (mode === 'reset') {
        subtitle.textContent = 'أدخل كلمة المرور الجديدة لحسابك';
      }
    }

    tabLogin.addEventListener('click', () => showPanel('login'));
    tabRegister.addEventListener('click', () => showPanel('register'));

    document.getElementById('show-forgot-btn')?.addEventListener('click', () => showPanel('forgot'));
    document.getElementById('back-to-login-btn')?.addEventListener('click', () => showPanel('login'));

    const params = new URLSearchParams(window.location.search);
    if (params.get('token')) {
      showPanel('reset');
    } else if (params.get('mode') === 'register') {
      showPanel('register');
    }
  }

  async function finalizePostAuthNavigation() {
    try {
      const rawPending = sessionStorage.getItem('pending_booking');
      if (rawPending) {
        const booking = JSON.parse(rawPending);
        const res = await fetch('/api/appointments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(booking)
        });
        const data = await res.json();
        sessionStorage.removeItem('pending_booking');

        if (res.ok) {
          ClinicUI.showToast('تم تسجيل الدخول وتثبيت موعدك المحفوظ بنجاح');
          setTimeout(() => {
            window.location.href = '/dashboard.html';
          }, 900);
          return;
        } else {
          ClinicUI.showToast(data.error || 'يرجى مراجعة تفاصيل الموعد المحفوظ', 'warning');
          setTimeout(() => {
            window.location.href = '/#booking';
          }, 1200);
          return;
        }
      }
    } catch (e) {}

    setTimeout(() => {
      window.location.href = '/dashboard.html';
    }, 750);
  }

  function bindForms() {
    // 1. Login Form
    const loginForm = document.getElementById('panel-login');
    const loginBtn = document.getElementById('login-submit-btn');

    loginForm?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('login-email').value.trim();
      const password = document.getElementById('login-password').value;

      let valid = true;
      if (!email || !email.includes('@')) {
        ClinicUI.setFieldError('login-email', 'login-email-error', 'يرجى إدخال بريد إلكتروني صحيح');
        valid = false;
      } else {
        ClinicUI.setFieldError('login-email', 'login-email-error', '');
      }

      if (!password) {
        ClinicUI.setFieldError('login-password', 'login-password-error', 'يرجى إدخال كلمة المرور');
        valid = false;
      } else {
        ClinicUI.setFieldError('login-password', 'login-password-error', '');
      }

      if (!valid) {
        avatarController?.reactError('يرجى إكمال بيانات الدخول');
        return;
      }

      ClinicUI.setButtonLoading(loginBtn, true, 'جاري التحقق...');
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || 'بيانات الدخول غير صحيحة');
        }

        avatarController?.reactSuccess(`أهلاً بك، ${data.user.name}`);
        ClinicUI.showToast(`أهلاً بك، ${data.user.name}`);
        await finalizePostAuthNavigation();
      } catch (err) {
        avatarController?.reactError('تعذر تسجيل الدخول');
        ClinicUI.showToast(err.message, 'error');
      } finally {
        ClinicUI.setButtonLoading(loginBtn, false);
      }
    });

    // 2. Register Form
    const regForm = document.getElementById('panel-register');
    const regBtn = document.getElementById('register-submit-btn');

    regForm?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('reg-name').value.trim();
      const email = document.getElementById('reg-email').value.trim();
      const phone = document.getElementById('reg-phone').value.trim();
      const password = document.getElementById('reg-password').value;

      let valid = true;
      if (name.length < 3) {
        ClinicUI.setFieldError('reg-name', 'reg-name-error', 'يرجى إدخال الاسم الكامل (3 أحرف على الأقل)');
        valid = false;
      } else {
        ClinicUI.setFieldError('reg-name', 'reg-name-error', '');
      }

      if (!email || !email.includes('@')) {
        ClinicUI.setFieldError('reg-email', 'reg-email-error', 'يرجى إدخال بريد إلكتروني صحيح');
        valid = false;
      } else {
        ClinicUI.setFieldError('reg-email', 'reg-email-error', '');
      }

      if (password.length < 6) {
        ClinicUI.setFieldError('reg-password', 'reg-password-error', 'كلمة المرور يجب أن تكون 6 أحرف على الأقل');
        valid = false;
      } else {
        ClinicUI.setFieldError('reg-password', 'reg-password-error', '');
      }

      if (!valid) {
        avatarController?.reactError('يرجى مراجعة الحقول المطلوبة');
        return;
      }

      ClinicUI.setButtonLoading(regBtn, true, 'جاري إنشاء الحساب...');
      try {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, phone, password })
        });
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || 'تعذر إنشاء الحساب');
        }

        avatarController?.reactSuccess('تم إنشاء الحساب بنجاح');
        ClinicUI.showToast('تم إنشاء حسابك بنجاح');
        await finalizePostAuthNavigation();
      } catch (err) {
        avatarController?.reactError('تعذر إنشاء الحساب');
        ClinicUI.showToast(err.message, 'error');
      } finally {
        ClinicUI.setButtonLoading(regBtn, false);
      }
    });

    // 3. Forgot Password Form
    const forgotForm = document.getElementById('panel-forgot');
    const forgotBtn = document.getElementById('forgot-submit-btn');

    forgotForm?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('forgot-email').value.trim();

      if (!email || !email.includes('@')) {
        ClinicUI.setFieldError('forgot-email', 'forgot-email-error', 'يرجى إدخال بريد إلكتروني صحيح');
        avatarController?.reactError('البريد الإلكتروني غير صحيح');
        return;
      }
      ClinicUI.setFieldError('forgot-email', 'forgot-email-error', '');

      ClinicUI.setButtonLoading(forgotBtn, true, 'جاري الإرسال...');
      try {
        const res = await fetch('/api/auth/forgot-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'تعذر إرسال رابط الاستعادة');

        avatarController?.reactSuccess('تم إرسال رابط الاستعادة');
        ClinicUI.showToast(data.message || 'تم إرسال رابط استعادة كلمة المرور إلى بريدك الإلكتروني');
      } catch (err) {
        avatarController?.reactError('تعذر الإرسال');
        ClinicUI.showToast(err.message, 'error');
      } finally {
        ClinicUI.setButtonLoading(forgotBtn, false);
      }
    });

    // 4. Reset Password Form
    const resetForm = document.getElementById('panel-reset');
    const resetBtn = document.getElementById('reset-submit-btn');

    resetForm?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const newPassword = document.getElementById('reset-new-password').value;
      const token = new URLSearchParams(window.location.search).get('token');

      if (newPassword.length < 6) {
        ClinicUI.setFieldError('reset-new-password', 'reset-password-error', 'كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل');
        avatarController?.reactError('كلمة المرور قصيرة');
        return;
      }
      ClinicUI.setFieldError('reset-new-password', 'reset-password-error', '');

      ClinicUI.setButtonLoading(resetBtn, true, 'جاري التحديث...');
      try {
        const res = await fetch('/api/auth/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, newPassword })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'رابط الاستعادة غير صالح أو منتهي الصلاحية');

        avatarController?.reactSuccess('تم تحديث كلمة المرور');
        ClinicUI.showToast('تم تحديث كلمة المرور بنجاح، يمكنك تسجيل الدخول الآن');
        setTimeout(() => {
          window.location.href = '/login.html';
        }, 1000);
      } catch (err) {
        avatarController?.reactError('رابط غير صالح');
        ClinicUI.showToast(err.message, 'error');
      } finally {
        ClinicUI.setButtonLoading(resetBtn, false);
      }
    });
  }
})();