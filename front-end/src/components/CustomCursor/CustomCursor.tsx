import React, { useState, useEffect, useRef, useCallback } from 'react';

// --- SVG Data URIs for Cursor States ---
// นี่คือรูปภาพ SVG ที่เข้ารหัสแบบ base64 ซึ่งจะใช้เป็นแหล่งที่มาสำหรับแท็ก <img>
// สถานะปกติ: วงกลมสีน้ำเงินขนาดเล็ก
const SVG_NORMAL = `data:image/svg+xml;base64,${btoa(`
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="6" fill="#60A5FA"/>
  </svg>
`)}`;

// สถานะเมื่อโฮเวอร์: วงแหวนสีชมพูขนาดใหญ่ขึ้นพร้อมวงกลมด้านในขนาดเล็ก
const SVG_HOVER = `data:image/svg+xml;base64,${btoa(`
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" stroke="#F472B6" stroke-width="2"/>
    <circle cx="12" cy="12" r="4" fill="#F472B6"/>
  </svg>
`)}`;

// สถานะเมื่อคลิก: สี่เหลี่ยมสีเขียวขนาดเล็ก
const SVG_CLICKING = `data:image/svg+xml;base64,${btoa(`
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="7" y="7" width="10" height="10" fill="#4ADE80"/>
  </svg>
`)}`;


// --- CustomCursor Component ---
// คอมโพเนนต์นี้ใช้รูปภาพ SVG สำหรับการแสดงผลเคอร์เซอร์
const CustomCursor: React.FC = () => {
  const [isHovering, setIsHovering] = useState(false); // สถานะเพื่อติดตามว่าเคอร์เซอร์กำลังโฮเวอร์อยู่เหนือเป้าหมายหรือไม่
  const [isClicking, setIsClicking] = useState(false); // สถานะเพื่อติดตามว่ากำลังคลิกอยู่หรือไม่
  const cursorDotRef = useRef<HTMLDivElement>(null); // Ref สำหรับคอนเทนเนอร์ div ของเคอร์เซอร์
  const mouseCoordsRef = useRef({ x: 0, y: 0 }); // Ref เพื่อจัดเก็บพิกัดเมาส์ล่าสุด
  const animationFrameId = useRef<number | null>(null); // เพื่อจัดเก็บ ID ของ requestAnimationFrame สำหรับการล้างข้อมูล

  // updateCursorPosition: เรียกโดย requestAnimationFrame เพื่ออัปเดตตำแหน่งและขนาดของเคอร์เซอร์
  // เพื่อการเคลื่อนไหวที่ราบรื่น
  const updateCursorPosition = useCallback(() => {
    if (cursorDotRef.current) {
      const { x, y } = mouseCoordsRef.current;
      cursorDotRef.current.style.left = `${x}px`;
      cursorDotRef.current.style.top = `${y}px`;

      let scale = 1; // ขนาดเริ่มต้น

      // กำหนดขนาดตามสถานะการคลิก/โฮเวอร์
      if (isClicking) { // ใช้สถานะ 'isClicking' ล่าสุด
        scale = 0.75; // เล็กลงเมื่อคลิก
      } else if (isHovering) { // ใช้สถานะ 'isHovering' ล่าสุด
        scale = 1.5; // ใหญ่ขึ้นเมื่อโฮเวอร์
      }

      // ใช้การแปลงขนาดกับคอนเทนเนอร์ของเคอร์เซอร์
      cursorDotRef.current.style.transform = `translate(-50%, -50%) scale(${scale})`;
    }
    // ดำเนินการวนซ้ำแอนิเมชันสำหรับเฟรมถัดไป
    animationFrameId.current = requestAnimationFrame(updateCursorPosition);
  }, [isHovering, isClicking]); // ตอนนี้ขึ้นอยู่กับสถานะ isHovering และ isClicking

  // handleMouseMove: จับพิกัดเมาส์และจัดการวนซ้ำแอนิเมชัน
  const handleMouseMove = useCallback((e: MouseEvent) => {
    mouseCoordsRef.current = { x: e.clientX, y: e.clientY };

    // เริ่มวนซ้ำแอนิเมชันหากยังไม่ทำงาน
    if (animationFrameId.current === null) {
      animationFrameId.current = requestAnimationFrame(updateCursorPosition);
    }

    // ตรวจจับว่าเมาส์อยู่เหนือองค์ประกอบเชิงโต้ตอบหรือไม่ (ทำเครื่องหมายด้วย 'hover-target')
    const target = e.target as HTMLElement;
    const isOverTarget = target.closest('.hover-target') !== null;
    setIsHovering(isOverTarget); // อัปเดตสถานะ
  }, [updateCursorPosition]); // 'updateCursorPosition' เป็น dependency เนื่องจากถูกเรียกที่นี่

  // handleMouseDown: อัปเดตสถานะการคลิก
  const handleMouseDown = useCallback(() => {
    setIsClicking(true); // อัปเดตสถานะ
  }, []);

  // handleMouseUp: รีเซ็ตสถานะการคลิก
  const handleMouseUp = useCallback(() => {
    setIsClicking(false); // อัปเดตสถานะ
  }, []);

  // useEffect hook เพื่อตั้งค่าและล้างตัวฟังเหตุการณ์ทั่วโลก
  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);

    // ฟังก์ชันล้างข้อมูล: ถูกเรียกเมื่อคอมโพเนนต์ถูกถอดออก
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);

      // ยกเลิกเฟรมแอนิเมชันที่กำลังดำเนินการอยู่เพื่อป้องกันการรั่วไหล
      if (animationFrameId.current !== null) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [handleMouseMove, handleMouseDown, handleMouseUp]); // Dependencies สำหรับตัวฟังเหตุการณ์

  // กำหนดว่าควรแสดง SVG ใดตามสถานะปัจจุบัน
  let currentSvgSrc = SVG_NORMAL;
  if (isClicking) {
    currentSvgSrc = SVG_CLICKING;
  } else if (isHovering) {
    currentSvgSrc = SVG_HOVER;
  }

  return (
    <div
      ref={cursorDotRef} // เชื่อม ref กับ div นี้ ซึ่งเป็นคอนเทนเนอร์ภาพของเคอร์เซอร์
      className="cursor-dot" // ใช้สไตล์พื้นฐานสำหรับคอนเทนเนอร์
      style={{ left: '0px', top: '0px' }} // ตำแหน่งเริ่มต้น จะถูกอัปเดตโดย JS
    >
      {/* แท็ก <img> จะแสดง SVG ที่เลือก React จะจัดการการ re-rendering
          เมื่อ `currentSvgSrc` เปลี่ยนแปลงเนื่องจากการอัปเดตสถานะ `isHovering` หรือ `isClicking` */}
      <img src={currentSvgSrc} alt="custom cursor" />
    </div>
  );
};
export default CustomCursor